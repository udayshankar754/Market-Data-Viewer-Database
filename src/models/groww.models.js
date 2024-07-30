import mongoose, { Schema } from 'mongoose';

// Define your schema
const growwSchema = new Schema(
  {
    gsin: {
      type: String,
    },
    isin: {
      type: String,
    },
    companyName: {
      type: String,
    },
    searchId: {
      type: String,
    },
    bseScriptCode: {
      type: String,
    },
    nseScriptCode: {
      type: String,
    },
    companyShortName: {
      type: String,
    },
    companyUrl: {
      type: String,
    },
    marketCap: {
      type: Number,
    },
    equityType: {
      type: String,
    },
    growwContractId: {
      type: String,
    },
    ltp: {
      type: Number,
      required: true, // Add if 'ltp' is required
    },
    close: {
      type: Number,
    },
    dayChange: {
      type: Number,
    },
    dayChangePerc: {
      type: Number,
    },
    high: {
      type: Number,
    },
    low: {
      type: Number,
    },
    yearHighPrice: {
      type: Number,
    },
    yearLowPrice: {
      type: Number,
    },
    lpr: {
      type: Number,
    },
    upr: {
      type: Number,
    },
    
  },
  {
    timestamps: true,
  }
);

const getDateCollectionName = (timestamp, marketUniverse, category) => {
  const date = new Date(timestamp);

  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(date);

  const dateString = parts.reduce((acc, part) => {
    switch (part.type) {
      case 'day': return acc + part.value;
      case 'month': return acc + part.value;
      case 'year': return acc + part.value;
      case 'hour': return acc + part.value;
      case 'minute': return acc + part.value;
      case 'second': return acc + part.value;
      default: return acc;
    }
  }, '');

  const sanitizedCategory = category.replace(/\s+/g, '_').toUpperCase();
  const sanitizedMarketUniverse = marketUniverse.replace(/\s+/g, '_').toUpperCase();

  return `groww_${dateString}_${sanitizedMarketUniverse}_${sanitizedCategory}`;
};

const getGrowwModel = (timestamp, marketUniverse, category) => {
  const collectionName = getDateCollectionName(timestamp, marketUniverse, category);

  // Check if the model is already registered
  if (mongoose.modelNames().includes(collectionName)) {
    return mongoose.model(collectionName);
  }

  // Register a new model
  return mongoose.model(collectionName, growwSchema, collectionName);
};

export { getGrowwModel };
