import mongoose from 'mongoose';
import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getGrowwModel } from '../models/groww.models.js';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx'; // Import XLSX library

// Function to get the current date and time in the format ddmmyyyyhhmm
const getFormattedDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${day}${month}${year}${hours}${minutes}`;
};

const uploadDhanDataToDbGroww = asyncHandler(async (req, res) => {
  const { token, pageSize } = req.body;

  if (!token) {
    throw new ApiError(401, 'Unauthorized access token');
  }

  const page = parseInt(pageSize) || 100;
  const url_filter = 'https://groww.in/v1/api/stocks_data/explore/v2/indices/market_trends/filters';

  const tokenData = 'eyJraWQiOiJXTTZDLVEiLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3MjMyODgzMjYsImlhdCI6MTcyMzAwNDY1NywibmJmIjoxNzIzMDA0NjA3LCJzdWIiOiJ7XCJlbWFpbElkXCI6XCJjaGFuZGFucHVyYmV5NzU0QGdtYWlsLmNvbVwiLFwicGxhdGZvcm1cIjpcIndlYlwiLFwicGxhdGZvcm1WZXJzaW9uXCI6bnVsbCxcIm9zXCI6bnVsbCxcIm9zVmVyc2lvblwiOm51bGwsXCJpcEFkZHJlc3NcIjpcIjE4Mi43Ny41Ny42MixcIixcIm1hY0FkZHJlc3NcIjpudWxsLFwidXNlckFnZW50XCI6XCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI3LjAuMC4wIFNhZmFyaS81MzcuMzZcIixcImdyb3d3VXNlckFnZW50XCI6bnVsbCxcImRldmljZUlkXCI6XCI0MzcwZTE5Yi0zYjM3LTU2ZGItOGYwZS05YzFmOWQ1NzkzZTVcIixcInNlc3Npb25JZFwiOlwiMTJmNTZmYTAtZmU2Zi00NGRlLTk4ZTEtZTliZmQwNWEyM2M5XCIsXCJzdXBlckFjY291bnRJZFwiOlwiQUNDOTI2MDUwMTI1NzEyMzRcIixcInVzZXJBY2NvdW50SWRcIjpcIkFDQzkyNjA1MDEyNTcxMjM0XCIsXCJ0eXBlXCI6XCJBVFwiLFwidG9rZW5FeHBpcnlcIjoxNzIzMjg4MzI2NjkzLFwidG9rZW5JZFwiOlwiMjkzOGIzOTQtZWMyYS00YTM3LTk4ZDgtYzRhZDlhMGYyY2JhXCJ9IiwiaXNzIjoiZ3Jvd3diaWxsaW9ubWlsbGVubmlhbCJ9.l063Yv_-QIdC9lS8YcbkKRWg6m8r7cf82YZHFLtQumji9J5qy6FoPgT1t2qKRRG-kPmrJQrB95p-CQE8QLJ14w';

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
          .then(async response => {
            const { categoryResponseMap, timeStamp } = response.data;

            const categoryPromises = Object.keys(categoryResponseMap).map(async category => {
              const items = categoryResponseMap[category]?.items?.map(item => ({
                gsin: item.gsin,
                isin: item.company.isin,
                companyName: item.company.companyName,
                searchId: item.company.searchId,
                bseScriptCode: item.company.bseScriptCode,
                nseScriptCode: item.company.nseScriptCode,
                companyShortName: item.company.companyShortName,
                companyUrl: item.company.logoUrl,
                marketCap: item.company.marketCap,
                equityType: item.company.equityType,
                growwContractId: item.company.growwContractId,
                ltp: item.stats.ltp,
                close: item.stats.close,
                dayChange: item.stats.dayChange,
                dayChangePerc: item.stats.dayChangePerc,
                high: item.stats.high,
                low: item.stats.low,
                yearHighPrice: item.stats.yearHighPrice,
                yearLowPrice: item.stats.yearLowPrice,
                lpr: item.stats.lpr,
                upr: item.stats.upr
              }));

              if (items?.length > 0) {
                const GrowwModel = getGrowwModel(timeStamp, universe.displayName, category);

                try {
                  await GrowwModel.insertMany(items);

                  const xlsxName = GrowwModel.modelName;
                  const dateTimeString = getFormattedDateTime();
                  const directoryPath = path.join('Groww', dateTimeString);
                  const filePath = path.join(directoryPath, `${xlsxName}.xlsx`);

                  if (!fs.existsSync(directoryPath)) {
                    fs.mkdirSync(directoryPath, { recursive: true });
                  }

                  // Create a new workbook and add the worksheet
                  const workbook = XLSX.utils.book_new();
                  const worksheet = XLSX.utils.json_to_sheet(items);
                  XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Gainers');

                  // Write to file
                  XLSX.writeFile(workbook, filePath);

                  console.log(`Excel file created successfully at ${filePath}`);
                } catch (err) {
                  throw new ApiError(500, `Failed to insert items for category ${category}`);
                }
              } else {
                console.log(`No data found for universe ${universe.universeId} and market trend ${marketTrend.displayName}`);
              }
            });

            return Promise.all(categoryPromises);
          })
          .catch(err => {
            console.log(`Failed to fetch data from ${url}`);
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
