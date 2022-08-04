import express, { Request, Response, NextFunction } from 'express'
import Shopify, { ShopifyHeader } from '@shopify/shopify-api'
import crypto from 'crypto'

async function verifyWebhookRequest(req: Request, res: Response, next: NextFunction) {
	try {
		const generatedHash = crypto.createHmac('SHA256', Shopify.Context.API_SECRET_KEY).update(JSON.stringify(req.body), 'utf8').digest('base64');
		const hmac = req.header('X-Shopify-Hmac-SHA256'); 
		const safeCompareResult = Shopify.Utils.safeCompare(generatedHash, hmac);

		if (!!safeCompareResult) {
			next();
		} else {
			return res.status(401).json({ succeeded: false, message: 'Not Authorized' }).send();
		}   
	} catch(error) {
		return res.status(401).json({ succeeded: false, message: 'Error caught' }).send();
	}
}

export { verifyWebhookRequest }