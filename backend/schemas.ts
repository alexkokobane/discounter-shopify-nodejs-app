import mongoose from 'mongoose'

const ShopSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
    unique: true
  },
  pricePlan: String,
  chargeDetails: {
    plan: String,
    confirmed: Boolean,
    id: String,
    confirmedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  newChargeDetails: {
    plan: String,
    id: String,
    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  shopifyPlan: String,
  name: String,
  billingAddress: {
    address1: String,
    address2: String,
    city: String,
    zip: String,
    country: String
  },
  devShop: Boolean,
  metaDescription:String,
  id: String,
  shopUrl: String,
  scope: [String],
  email: String,
  currencyCode: String,
  createdAt: {
    type: Date,
    default: Date.now()
  }
})

const Party = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  shop: String,
  createdAt: {
    type: Date,
    default: Date.now()
  }
})

Party.index({"createdAt": 1}, { expireAfterSeconds: 86400})


const ActiveShop = mongoose.model('Session', Party)
const Shop = mongoose.model('Shop', ShopSchema)

export { 
  ActiveShop,
  Shop
}