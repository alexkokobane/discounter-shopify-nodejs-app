import express, { Request, Response, NextFunction } from 'express'
import Shopify from '@shopify/shopify-api'
import { Shop, ActiveShop } from './schemas'

const webhooks = express.Router()

// Handler functions
export const handleAppUninstall = async (topic: string, shop: string, webhookRequestBody: string) => {
	try{
		if(shop === "toally.myshopify.com"){
			await Shop.deleteOne({'shop': shop})
			const session = await ActiveShop.find({'shop': shop})
			if(session.length !== 0){
				await ActiveShop.deleteMany({'shop': shop})
			}
		}
		const removeBilling = await Shop.updateOne(
			{'shop': shop},
			{
				'$unset': {
					'pricePlan': 1,
					'chargeDetails': 1
				}
			}
		)
	} catch(err: any){
		return `ERROR: ${err}`
	}
}


// Routes
webhooks.post('/app-uninstalled', async (req, res) => {
	try{
		await Shopify.Webhooks.Registry.process(req, res)		
	} catch(err: any){
		return `ERROR: ${err}`
	}
})


export default webhooks