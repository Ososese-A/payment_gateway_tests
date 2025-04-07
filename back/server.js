require("dotenv").config()
const express = require("express")
const logger = require("./middleware/loggerMiddleware")
const cors = require("cors")
const { default: axios } = require("axios")
const Paystack = require("paystack")(process.env.KEY)
const base64 = require("base-64")

const app = express()

app.use(express.json())
app.use(logger)
app.use(cors())

// const getMonnifyAuthToken = async () => {
//     const credentials = `${process.env.MONNIFY_KEY}:${process.env.MONNIFY_SECRET}`
//     const encodedCredentials = Buffer.from(credentials).toString("base64")

//     try {
//         const response = await axios.post(
//             "https://sandbox.monnify.com/api/v1/auth/login",
//             {},
//             {
//                 headers: {
//                     Authorization: `Basic ${encodedCredentials}`
//                 }
//             }
//         )

//         return response.data.responseBody.accessToken
//     } catch (err) {
//         console.log("Error generating token:", err.message)
//         throw new Error("Failed to authenticate with Monnify")
//     }
// }

app.get("/", (req, res) => {
    res.json({msg: "Hello world"})
})

app.post("/pay", async (req, res) => {
    const {email, amount} = req.body
    // const email = "se@gmail.com"
    // const amount = 7500
    if (!email || !amount) {
        return res.status(400).json({error: "Email and amount are required"})
    }

    try {
        const pay = await Paystack.transaction.initialize({
            email: email,
            amount: amount * 100
        })

        if (!pay.data || !pay.data.authorization_url) {
            throw new Error("Authorization URL not returned by Paystack")
        }
        console.log(pay.data)
        res.status(200).json({ url: pay.data.authorization_url, ref: pay.data.reference })
    } catch (err) {
        console.log(err)
        console.log(err.message)
        res.status(500).json({error: err.message})
    }
})

app.get('/verify/:reference', async (req, res) => {
    const reference = req.params.reference

    try {
        const ref = await Paystack.transaction.verify(reference)
        console.log(ref)
        if (ref.data.status === "success") {
            return res.status(200).json({msg: "Transaction successful"})
        } else {
            return res.status(200).json({msg: "Transaction failed"})
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({error: err.message})
    }
})

// app.post("/monnify/pay", async (req, res) => {
//     const {email, amount} = req.body

//     if (!email || !amount) {
//         return res.status(400).json({ error: "Email and amount required" })
//     }

//     try {
//         const authToken = await getMonnifyAuthToken()

//         console.log("Payload:", {
//             amount: amount,
//             customerEmail: email,
//             paymentReference: `REF-${Date.now()}`,
//             contractCode: process.env.MONNIFY_CODE,
//             currencyCode: "NGN",
//             redirectUrl: "http://localhost:8080/monnify/verify"
//         })

//         const response = await axios.post(
//             "https://sandbox.monnify.com/api/v1/transactions/initiate",
//             {
//                 amount: amount,
//                 customerEmail: email,
//                 paymentReference: `REF-${Date.now()}`,
//                 contractCode: process.env.MONNIFY_CODE,
//                 currencyCode: "NGN",
//                 redirectUrl: "http://localhost:8080/monnify/verify"
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${authToken}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         const { checkoutUrl } = response.data.responseBody
//         res.json({ checkoutUrl, msg: "Payment sandbox initiated" })
//     } catch (err) {
//         console.log("Error Initializing payment", err.response ? err.response.data : err.message)
//         res.status(500).json({ error: err.message })
//     }
// })

app.get("/monnify/verify", async (req, res) => {
    const { paymentReference } = req.query;

    try {
        const response = await axios.get(
            `https://sandbox.monnify.com/api/v1/transactions/${paymentReference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MONNIFY_KEY}`
                }
            }
        )

        const { paymentStatus } = response.data.responseBody
        if (paymentStatus === "PAID") {
            res.json({ message: "Payment successful!" })
        } else {
            res.json({ message: "Payment not completed" })
        }
    } catch (err) {
        console.log("Error verifying payment:", err.message)
        res.status(500).json({error: err.message})
    }
})

const getMonnifyAuthToken = async () => {
    const credentials = `${process.env.MONNIFY_KEY}:${process.env.MONNIFY_SECRET}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64");

    try {
        const response = await axios.post(
            "https://sandbox.monnify.com/api/v1/auth/login",
            {},
            {
                headers: {
                    Authorization: `Basic ${encodedCredentials}`,
                },
            }
        );

        // console.log(response.data.responseBody.accessToken)
        return response.data.responseBody.accessToken;
    } catch (err) {
        console.error("Error generating token:", err.message);
        throw new Error("Failed to authenticate with Monnify");
    }
};

app.post("/monnify/pay", async (req, res) => {
    const { email, amount } = req.body;

    if (!email || !amount) {
        return res.status(400).json({ error: "Email and amount required" });
    }

    try {
        const authToken = await getMonnifyAuthToken();

        const response = await axios.post(
            "https://sandbox.monnify.com/api/v1/merchant/transactions/init-transaction",
            {
                amount: amount,
                customerName: "Stephen Ikhane",
                customerEmail: email,
                paymentReference: `REF-${Date.now()}`,
                paymentDescription: "Trial transaction",
                currencyCode: "NGN",
                contractCode: process.env.MONNIFY_CODE,
                redirectUrl: "http://localhost:8080/monnify/verify",
                paymentMethods:["CARD","ACCOUNT_TRANSFER"]
            },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const { checkoutUrl } = response.data.responseBody;
        res.json({ checkoutUrl, msg: "Payment sandbox initiated" });
    } catch (err) {
        console.error("Error Initializing payment:", err.response ? err.response.data : err.message);
        res.status(500).json({
            error: err.response ? err.response.data.responseMessage : err.message,
        });
    }
});

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Ready and listening at port: ${PORT}`)
})