import mongoose from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import axios from "axios"
import { getGrowwModel } from "../models/groww.models.js"

const uploadDhanDataToDb = asyncHandler(async (req, res) => {
  const { token, pageSize } = req.body;

  if (!token) {
    throw new ApiError(401, "Unauthorized access token");
  }

  const page = parseInt(pageSize) || 1000;
  const url_filter = `https://groww.in/v1/api/stocks_data/explore/v2/indices/market_trends/filters`;

  // Fetch filter types
  let filter_types;
  try {
    filter_types = await axios.get(url_filter);
  } catch (error) {
    throw new ApiError(500, "Failed to fetch filter types");
  }

  const { universes, marketTrends } = filter_types.data;

  // Collect all promises for processing
  const allPromises = [];

  for (const universe of universes) {
    for (const marketTrend of marketTrends) {
      const url = `https://groww.in/v1/api/stocks_data/explore/v2/indices/${universe.universeId}/market_trends?discovery_filter_types=${marketTrend.discoveryFilterType}&size=${page}`;

      // Push a promise to the array for each request
      allPromises.push(
        axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(response => {
            const { categoryResponseMap, timeStamp } = response.data;

            // Process each category in the response
            const categoryPromises = Object.keys(categoryResponseMap).map(async category => {
              console.log(categoryResponseMap[category]);
              const items = categoryResponseMap[category].items;

              // Get the Mongoose model with the dynamic collection name
              if(items?.length > 0) {
                const GrowwModel = getGrowwModel(timeStamp, universe.displayName, category);

                try {
                  // Insert items into the collection
                  await GrowwModel.insertMany(items);
                } catch (err) {
                  throw new ApiError(500, `Failed to insert items for category ${category}`);
                }
              }  else {
                console.log(`No data found for universe ${universe.universeId} and market trend ${marketTrend.displayName}`);
                return; // Skip the category if no data is found
              }
            });

            // Return the promise for processing categories
            return Promise.all(categoryPromises);
          })
          .catch(err => {
            console.log(url);
            throw new ApiError(500, `Failed to fetch data for universe ${universe.universeId} and market trend ${marketTrend.displayName}`);
          })
      );
    }
  }

  try {
    // Wait for all promises to complete
    await Promise.all(allPromises);
  } catch (err) {
    return res.status(err.status || 500).json(new ApiResponse(err.status || 500, err.message));
  }

  // Return a success response after all operations are complete
  return res.status(200).json(new ApiResponse(200, "Data Upload to DB Successfully", filter_types.data));
});



export {
    uploadDhanDataToDb, 
}