import express from 'express'
import Shopify from '@shopify/shopify-api'
import path from 'path'

const routes = express.Router()

routes.get('/', async (req, res) => {
	try{
		res.send("You're home!")
	} catch(err: any){
		return `ERROR: ${err}`
	}
})

routes.get('/billing-plans', async (req, res) => {
	try{
		res.send("Here are your billing plans")
	} catch(err: any){
		return {
			"error": "Could not fetch resource."
		}
	}
})


export default routes