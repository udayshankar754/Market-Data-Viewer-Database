import mongoose from 'mongoose';
import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getGrowwModel } from '../models/groww.models.js';

const uploadDhanDataToDbGroww = asyncHandler(async (req, res) => {
  const { token, pageSize } = req.body;

  if (!token) {
    throw new ApiError(401, 'Unauthorized access token');
  }

  const page = parseInt(pageSize) || 100;
  const url_filter = 'https://groww.in/v1/api/stocks_data/explore/v2/indices/market_trends/filters';

  const tokenData = 'eyJraWQiOiJXTTZDLVEiLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3MjI2MDI5NTYsImlhdCI6MTcyMjMxMzAyNywibmJmIjoxNzIyMzEyOTc3LCJzdWIiOiJ7XCJlbWFpbElkXCI6XCJjaGFuZGFucHVyYmV5NzU0QGdtYWlsLmNvbVwiLFwicGxhdGZvcm1cIjpcIndlYlwiLFwicGxhdGZvcm1WZXJzaW9uXCI6bnVsbCxcIm9zXCI6bnVsbCxcIm9zVmVyc2lvblwiOm51bGwsXCJpcEFkZHJlc3NcIjpcIjE4Mi43Ny41Ny42MixcIixcIm1hY0FkZHJlc3NcIjpudWxsLFwidXNlckFnZW50XCI6XCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI3LjAuMC4wIFNhZmFyaS81MzcuMzZcIixcImdyb3d3VXNlckFnZW50XCI6bnVsbCxcImRldmljZUlkXCI6XCI0MzcwZTE5Yi0zYjM3LTU2ZGItOGYwZS05YzFmOWQ1NzkzZTVcIixcInNlc3Npb25JZFwiOlwiMTJmNTZmYTAtZmU2Zi00NGRlLTk4ZTEtZTliZmQwNWEyM2M5XCIsXCJzdXBlckFjY291bnRJZFwiOlwiQUNDOTI2MDUwMTI1NzEyMzRcIixcInVzZXJBY2NvdW50SWRcIjpcIkFDQzkyNjA1MDEyNTcxMjM0XCIsXCJ0eXBlXCI6XCJBVFwiLFwidG9rZW5FeHBpcnlcIjoxNzIyNjAyOTU2MjU0LFwidG9rZW5JZFwiOlwiMjFjNjFlMGMtNTkyYy00NWQzLWJlOTYtMTA1YWFlNzNlZGE3XCJ9IiwiaXNzIjoiZ3Jvd3diaWxsaW9ubWlsbGVubmlhbCJ9.L_P77AxbEVB4ZriPBeevgEMaX2SVPxbj4mMeRARAqgPoz60-sQ9Q8gwXlvQ1x2BbINtP_A0CtKCz46Gmdcq4ow';

  // Fetch filter types
  let filter_types;
  try {
    filter_types = await axios.get(url_filter);
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch filter types');
  }

  const { universes, marketTrends } = filter_types.data;

  // Collect all promises for processing
  const allPromises = [];

  for (const universe of universes) {
    for (const marketTrend of marketTrends) {
      const url = `https://groww.in/v1/api/stocks_data/explore/v2/indices/${universe.universeId}/market_trends?discovery_filter_types=${marketTrend.discoveryFilterType}&size=${page}`;

      allPromises.push(
        axios.get(url, { headers: { 'Authorization': `Bearer ${tokenData}` } })
          .then(response => {
            const { categoryResponseMap, timeStamp } = response.data;

            const categoryPromises = Object.keys(categoryResponseMap).map(async category => {
              const items = categoryResponseMap[category].items;

              if (items?.length > 0) {
                const GrowwModel = getGrowwModel(timeStamp, universe.displayName, category);

                try {
                  await GrowwModel.insertMany(items);
                } catch (err) {
                  throw new ApiError(500, `Failed to insert items for category ${category}`);
                }
              } else {
                console.log(`No data found for universe ${universe.universeId} and market trend ${marketTrend.displayName}`);
                return;
              }
            });

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
    await Promise.all(allPromises);
  } catch (err) {
    return res.status(err.status || 500).json(new ApiResponse(err.status || 500, err.message));
  }

  return res.status(200).json(new ApiResponse(200, 'Data Upload to DB Successfully', filter_types.data));
});

export { uploadDhanDataToDbGroww };
