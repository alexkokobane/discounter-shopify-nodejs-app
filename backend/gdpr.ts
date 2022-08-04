import express, { Request, Response, NextFunction } from 'express'
import {verifyWebhookRequest} from './middlewares' 

const gdpr = express.Router()

gdpr.post('/shop-redact', verifyWebhookRequest, async (req, res) => {
	res.status(200).send("Webhook processed")
	try{
		const shop: string = req.body.shop_domain
		console.log(`${shop} has been obliterated.`)
	} catch(err: any){
		return `ERROR: ${err}`
	}
})

gdpr.post('/customers-data-request', verifyWebhookRequest, async (req, res) => {
	res.status(200).send("Webhook processed")
	try{
		const shop: string = req.body.shop_domain
		const customerEmail: string = req.body.customer.email
	} catch(err: any){
		return `ERROR: ${err}`
	}
})

gdpr.post('/customers-redact', verifyWebhookRequest, async (req, res) => {
	res.status(200).send("Webhook processed")
	try{
		const shop: string = req.body.shop_domain
		const customerEmail: string = req.body.customer.email
	} catch(err: any){
		return `ERROR: ${err}`
	}
})

export default gdpr