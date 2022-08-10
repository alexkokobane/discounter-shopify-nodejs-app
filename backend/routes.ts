import express from 'express'
import Shopify from '@shopify/shopify-api'
import path from 'path'
import { generateDiscountCode } from './utils'

const routes = express.Router()

interface DiscountData {
	name: string,
	prize: number
}

routes.get('/', async (req, res) => {
	try{
		res.send("You're home!")
	} catch(err: any){
		return `ERROR: ${err}`
	}
})

routes.get('/billing', async (req, res) => {
	try{
		res.send("Here are your billing plans")
	} catch(err: any){
		return {
			"error": "Could not fetch resource."
		}
	}
})

routes.get('/login', async (req, res) => {
	try {
		res.send("Login into this app")
	} catch{
		res.send("Could not display page")
	}
})


routes.get('/discount/create', async (req, res) => {
	const data: DiscountData = req.body.data
	const discountCode: string = generateDiscountCode(8)
	const amount: string = data.prize.toString()
	try {
		const session = await Shopify.Utils.loadCurrentSession(req, res, true)
		const client = new Shopify.Clients.Graphql(session.shop, session.accessToken)
		const discount: any = await client.query({
			data: {
				"query": `mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
					discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
						codeDiscountNode {
							codeDiscount{
								...on DiscountCodeBasic {
									codes(first: 1) {
										edges {
											node {
												code,
												id
											}
										}
									}
								}
							}
						}
						userErrors {
							field
							message
						}
					}
				}`,
				"variables": {
					"basicCodeDiscount": {
						"appliesOncePerCustomer": true,
						"code": discountCode,
						"customerGets": {
							"items": {
								"all": true
							},
							"value": {
								"discountAmount": {
									"amount": amount,
									"appliesOnEachItem": false
								}
							}
						},
						"customerSelection": {
							"all": true
						},
						"endsAt": null,
						"minimumRequirement": {
							"quantity": {
								"greaterThanOrEqualToQuantity": "1"
							}
						},
						"startsAt": new Date(Date.now()).toISOString(),
						"title": data.name,
						"usageLimit": 1
					}
				}
			}
		})

		res.redirect(`/?discountName=${data.name}&status=Created`)
	} catch(err: any) {
		res.json({
			"error": err
		})
	}
})


export default routes