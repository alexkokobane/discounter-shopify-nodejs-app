import express, { Request, Response, NextFunction } from 'express'
import Shopify, { ShopifyHeader } from '@shopify/shopify-api'
import crypto from 'crypto'
import { getShop } from './utils'
import { Shop } from './schemas'

const verifyWebhookRequest = async (req: Request, res: Response, next: NextFunction) => {
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

const checkAuth = async (req: Request, res: Response, next:NextFunction) => {
	try {
		const session = await Shopify.Utils.loadCurrentSession(req, res, true)
		const shop = getShop(req)
		if (!session && shop === 'undefined') {
			return res.status(401).json({
				"error": "No session found."
			})
		} else if(!session && shop !== 'undefined') {
			const store = await Shop.findOne({shop: shop})
			if(!store){
				return res.send("Please install this app from the Shopify App Store")
			}
			return res.redirect(`/auth?shop=${store.shop}`)
		} else {
			next()
		}
	} catch(err: any) {
		return res.json({
			"error": err
		})
	}
}

const checkApiAuth = async (req: Request, res: Response, next:NextFunction) => {
	try {
		const session = await Shopify.Utils.loadCurrentSession(req, res, true)
		if (!session) {
			return res.status(401).send("Unauthorized")
		}
		next()
	} catch(err: any) {
		return res.json({
			"error": err
		})
	}
}

const loggedInCtx = async(req: Request, res: Response, next: NextFunction) => {
	try{
		const session = await Shopify.Utils.loadCurrentSession(req, res, true)
		session ? res.redirect('/') : next()
	} catch(err: any){
		return res.json({
			"error": err
		})
	}
}

const corsMiddleware = async(req: Request, res: Response, next: NextFunction) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Request-Method", "POST")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
}

export { 
	verifyWebhookRequest,
	checkAuth,
	checkApiAuth,
	corsMiddleware,
	loggedInCtx
}