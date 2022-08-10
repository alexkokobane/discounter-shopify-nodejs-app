import { Request, Response } from 'express'
import { SessionInterface } from '@shopify/shopify-api'
import {ActiveShop} from './schemas'


// Get shop query from url
export const getShop = (req: Request, res?: Response): string => {
	let shop: string

	if (req.query.shop && typeof req.query.shop === 'string') {
	  shop = req.query.shop
	} else {
	  shop = 'undefined'
	}

	return shop 
}

// Custom session storage functions
interface StringSession {
	id: string,
	session: string
}

export const storeCallback = async (session: SessionInterface): Promise<boolean> => {
	try {
		const check =  await ActiveShop.findOne({id: session.id})
		if(check !== null ) {
			await ActiveShop.findOneAndUpdate({id: session.id},{
				session: JSON.stringify(session)
			},{ new: true })
		} else {
			const store = new ActiveShop({
				id: session.id ,
				session: JSON.stringify(session),
				shop: session.shop
			})
			await store.save()
		 }
		return true
	} catch {
		return false
	}
}

export const loadCallback = async (id: string): Promise<SessionInterface | undefined> => {
	try {
		const load: StringSession = await ActiveShop.findOne({id: id})
		if(load) {
			const session: SessionInterface = JSON.parse(load.session)
			return session
		}
	} catch {
		return undefined
	}
}

export const deleteCallback = async (id: string): Promise<boolean> => {
	try {
		await ActiveShop.findOneAndDelete({id: id})
		return true
	} catch {
		return false
	}
}

// Generate a discount code
export const generateDiscountCode = (length: number): string => {
	let result: string = '';
	let characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let charactersLength = characters.length;
	for ( let i = 0; i < length; i++ ) {
	  	result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}