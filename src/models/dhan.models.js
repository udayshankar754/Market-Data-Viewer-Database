import mongoose ,{Schema} from "mongoose";


const dhanSchema = new Schema(
    {
        DayRsI14CurrentCandle : {
          type: Number,
        },
        DaySMA200CurrentCandle : {
          type: Number,
        },
        DaySMA50CurrentCandle : {
          type: Number,
        },
        DispSym : {
          type: String,
          required: true,
          index : true,
        },
        DivYeild : {
          type: Number,
        },
        Eps : {
          type: Number,
        },
        Exch : {
          type: String,
        },
        High1Yr : { 
          type: Number,
        },
        Ind_Pe : {
          type: Number,
        },
        Isin : {
          type: String,
        },
        LotSize : {
          type: Number,
        },
        Low1Yr : {
          type: Number,
        },
        Ltp : {
          type: Number,
        },
        Mcap : {
          type: Number,
        },
        Multiplier : {
          type: Number,
        },
        NetProfitMargin : {
          type : Number,
        },
        PPerchange : {
          type: Number,
        },
        Pb : {
          type: Number,
        },
        Pchange : {
          type: Number,
        },
        Pe : {
          type: Number,
        },
        PricePerchng1year : {
          type: Number,
        },
        PricePerchng3year : {
          type: Number,
        },
        PricePerchng5year : {
          type: Number,
        },
        Revenue : {
          type: Number,
        },
        Seg : {
          type: String,
        },
        Seosym : {
          type: String,
        },
        Sid : {
          type: Number,
        },
        Sym : {
          type: String,
          index : true,
        },
        TickSize : {
          type: Number,
        },
        Volume : {
          type: Number,
        },
        Year1ROCE : {
          type: Number,
        },
        Year1ROE : {
          type: Number,
        },
        Year1RevenueGrowth : {
          type: Number,
        },
        YoYLastQtrlyProfitGrowth : {
          type: Number,
        },
    },
    {
        timestamps: true,
    }
)

// 

const getDateCollectionName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `dhans_${day}${month}${year}`; // Using _ instead of / for valid collection name
};

const collectionName = getDateCollectionName();
export const Dhan = mongoose.model('Dhan', dhanSchema, collectionName);

// export const Dhan = mongoose.model("Dhan", dhanSchema)