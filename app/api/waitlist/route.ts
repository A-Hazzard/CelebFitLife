import { NextResponse } from 'next/server';
import Waitlist from '../lib/models/waitlist';
import connectDB from '../lib/models/db';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL as string

export async function POST(request: Request) {
  
  try{
    const { email } = await request.json()

    if(!email){
      console.log("Email Required")
      return NextResponse.json({error: "Email Required"}, {status: 400})
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        console.error("Invalid Email Format")
        return NextResponse.json({error: "Invalid Email Format"}, {status: 400})
    }
  
    const sanitizedEmail = email.trim().toLowerCase()
  
    const db = await connectDB()

    if(!db){
        console.error("Network Error, Please Try Again Later.")
        return NextResponse.json({
            error: "Network Error, Please Try Again Later."
        }, { status: 200 })
    }


    const existingUser = await Waitlist.findOne({email: sanitizedEmail})

    if(existingUser){
        console.error("Email already registered")
        return Response.json({
            error: "Email Already Registered"
        }, { status: 409 })
    }

    const newEntry = await Waitlist.create({
        email: sanitizedEmail,
        paymentStatus: "pending"
    })

    if(!APP_BASE_URL){
        console.error("NO APP BASE URL, PROVIDE ONE")
        return NextResponse.json({
            error: "NO APP BASE URL, PROVIDE ONE"
        }, { status: 500 })
    }
    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, price_1234) of the product you want to sell
          price: '{{PRICE_ID}}',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_BASE_URL}/payment=success`,
      cancel_url: `${APP_BASE_URL}/?canceled=true`,
      client_reference_id: String(newEntry._id),
      customer_email: sanitizedEmail
    });

    return NextResponse.json({
      success: true,
      url: session.url
    }, {status: 201})
  }catch (error: unknown){
    console.error("Waitlist API Error:", error)
    return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
    );
  }
    
}

export async function GET(){
    try{
        const db = await connectDB()

        if(!db){
            console.log("Network Error, Please Try Again Later.")
            return NextResponse.json({
                error: "Network Error, Please Try Again Later."
            }, { status: 500 })
        }

        const [allWaitlists, count] = await Promise.all([
            Waitlist.find({}),
            Waitlist.countDocuments({ })
        ])

        console.log("Got Waitlist")
        return NextResponse.json({
            success: true,
            data: {
                allWaitlists, count
            }
        }, { status: 200 })

    }catch(error){
        console.log("Internal Server Error")
        return NextResponse.json({
            error: "Internal Server Error"
        }, { status: 500 })
    }
}