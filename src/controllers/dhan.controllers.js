import mongoose from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Dhan } from "../models/dhan.models.js"
import axios from "axios"
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

const uploadDhanDataToDb = asyncHandler(async (req, res) => {
  let url = 'https://ow-scanx-analytics.dhan.co/customscan/fetchdt'
  let body = {
    "data": {
        "sort": "",
        "sorder": "desc",
        "count": 1,
        "params": [
            {
                "field": "OgInst",
                "op": "",
                "val": "ES"
            },
            {
                "field": "Exch",
                "op": "",
                "val": "NSE"
            }
        ],
        "fields": [
            "Isin",
            "DispSym",
            "Mcap",
            "Pe",
            "DivYeild",
            "Revenue",
            "Year1RevenueGrowth",
            "NetProfitMargin",
            "YoYLastQtrlyProfitGrowth",
            "Year1ROCE",
            "EBIDTAMargin",
            "volume",
            "PricePerchng1year",
            "PricePerchng3year",
            "PricePerchng5year",
            "Ind_Pe",
            "Pb",
            "DivYeild",
            "Eps",
            "DaySMA50CurrentCandle",
            "DaySMA200CurrentCandle",
            "DayRSI14CurrentCandle",
            "Year1ROCE",
            "Year1ROE",
            "Sym"
        ],
        "pgno": 1
    }
  }

  let response = await axios.post(url,body)
  let finalResponse 
  if(response?.data?.data?.length > 0) {
    let totalCount = response?.data?.tot_rec || 10000;
    let reqBody =  {
      "data": {
          "sort": "",
          "sorder": "desc",
          "count": totalCount,
          "params": [
              {
                  "field": "OgInst",
                  "op": "",
                  "val": "ES"
              },
              {
                  "field": "Exch",
                  "op": "",
                  "val": "NSE"
              }
          ],
          "fields": [
              "Isin",
              "DispSym",
              "Mcap",
              "Pe",
              "DivYeild",
              "Revenue",
              "Year1RevenueGrowth",
              "NetProfitMargin",
              "YoYLastQtrlyProfitGrowth",
              "Year1ROCE",
              "EBIDTAMargin",
              "volume",
              "PricePerchng1year",
              "PricePerchng3year",
              "PricePerchng5year",
              "Ind_Pe",
              "Pb",
              "DivYeild",
              "Eps",
              "DaySMA50CurrentCandle",
              "DaySMA200CurrentCandle",
              "DayRSI14CurrentCandle",
              "Year1ROCE",
              "Year1ROE",
              "Sym"
          ],
          "pgno": 1
      }
    }
  
    const allResponse = await axios.post(url,reqBody)
    if(allResponse?.data?.data?.length > 0) {
      // const avilableInDb  = await Dhan
      finalResponse = await Dhan.insertMany(allResponse?.data?.data);
      const xlsxName = Dhan.modelName;
      const dateTimeString = getFormattedDateTime();
      const directoryPath = path.join('Dhan', dateTimeString);
      const filePath = path.join(directoryPath, `${xlsxName}.xlsx`);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Create a new workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allResponse?.data?.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Gainers');

      // Write to file
      XLSX.writeFile(workbook, filePath);

      console.log(`Excel file created successfully at ${filePath}`);
      return res.status(200).json(
        new ApiResponse(200, "Data Updated In DB Successfully" , `${allResponse?.data?.data?.length} records Inserted`)
      )
    } else {
      throw new ApiError(500, "Failed to Upload Data In DB")
    }
  } else {
    throw new ApiError(500, "No Data Found")
  }
})


export {
    uploadDhanDataToDb, 
}