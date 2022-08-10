import express, { Request, Response } from 'express'
import Shopify, { ApiVersion, 
	AuthQuery, 
	SessionInterface 
} from '@shopify/shopify-api'
import cors from 'cors'
import { Shop } from './schemas'
import { storeCallback, 
	loadCallback, 
	deleteCallback, 
	getShop 
} from './utils'
import {
	handleAppUninstall
} from './webhooks'
import { 
	corsMiddleware,
	loggedInCtx,
	checkAuth,
	checkApiAuth
} from './middlewares'

const auth = express.Router()

const { API_KEY, API_SECRET_KEY, SCOPES, HOST, SHOP } = process.env

Shopify.Context.initialize({
	API_KEY,
	API_SECRET_KEY,
	SCOPES: [SCOPES],
	HOST_NAME: HOST,
	IS_EMBEDDED_APP: false,
	API_VERSION: ApiVersion.January22,
	
	SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
		storeCallback,
		loadCallback,
		deleteCallback
	)
});

auth.get('/auth', async (req: Request, res: Response) => {
	const shop = getShop(req)
	try {		
		 let authRoute = await Shopify.Auth.beginAuth(
				req,
				res,
				shop,
				'/auth/callback',
				true,
			);
		return res.redirect(authRoute);
	} catch(err: any) {
		return res.redirect("/auth/callback/error")  
	}
});

auth.get('/auth/callback', async (req: Request, res: Response) => {
	try {
		const session = await Shopify.Auth.validateAuthCallback(
			req,
			res,
			req.query as unknown as AuthQuery,
		);
		
		const shop = getShop(req)
		const checkShop = await Shop.findOne({shop: session.shop})
			
		// Functional webhooks
		const appUnistalled = await Shopify.Webhooks.Registry.register({
			path: '/webhooks/app-uninstalled',
			topic: 'APP_UNINSTALLED',
			accessToken: session.accessToken,
			shop: session.shop
		})
		//console.log("Is this a webhook path? : "+Shopify.Webhooks.Registry.isWebhookPath('/webhooks'))

		// Check bills and db saved shops
		if(checkShop == null){
			const client = new Shopify.Clients.Graphql(session.shop, session.accessToken)
			const data: any = await client.query(
				{
					data: `{
						shop {
							name
							currencyCode
							email
							description
							id
							plan {
								displayName 
								partnerDevelopment
								shopifyPlus
							}
							url
							billingAddress {
								address1
								address2
								city
								zip
								country
							}
						}
					}`
				}
			)
			const shopData = data.body.data.shop
			const storeShop = new Shop({
				'shop': session.shop,
				'name': shopData.name,
				'email': shopData.email,
				'currencyCode': shopData.currencyCode,
				'shopifyPlan': shopData.plan.displayName,
				'devShop': shopData.plan.partnerDevelopment,
				'id': shopData.id,
				'url': shopData.url,
				'billingAddress': {
					'address1': shopData.billingAddress.address1,
					'address2': shopData.billingAddress.address2,
					'city': shopData.billingAddress.city,
					'zip': shopData.billingAddress.zip,
					'country': shopData.billingAddress.country
				},
				'metaDescription': shopData.description
			})
			storeShop.save()
			return res.redirect("/billing")
		}
		return res.redirect("/")		
	} catch (error) {
		return res.redirect("/auth/callback/error")  
	}
})

auth.get('/callback/error', async (req, res) => {
	res.render('pages/oauth-error')
})

auth.post('/login', loggedInCtx, async (req, res) => {
	try {

		const url = req.body.shop.replace(/\s+/g, '')
		const store = await Shop.findOne({shop: url})
		const plans = ["Freebie", "Appetizer", "Main"]
		if(store){
			return plans.includes(store.pricePlan) ? res.status(200).send("/auth?shop="+store.shop) : res.status(401).send("Subscription not found! Reinstall Windfall from the Shopify App Store to continue using it.")
		}

		const holder: string[] = url.split(".")
		console.log(holder)
		if(holder[1] !== "myshopify"){
			return res.status(401).send("Please use your 'myshopify' url.")
		} else if(holder[2] !== "com"){
			return res.status(401).send("Error! The top level domain of every 'myshopify' url is dot com.")
		}

		return res.status(401).send("Shop not found! Install Windfall from the Shopify App Store.")
	} catch(err: any) {
		return res.status(401).send("Error: "+err)
	}
})

auth.post('/logout', checkApiAuth, async (req, res) => {
	try {
		await Shopify.Utils.deleteCurrentSession(req, res, true)
		res.send("/")
	} catch(err: any) {
		return res.json({
			"error": err
		})
	}
})


// Register webhook handlers
Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
	path: "/webhooks/app-uninstalled",
	webhookHandler: handleAppUninstall,
})

export default auth