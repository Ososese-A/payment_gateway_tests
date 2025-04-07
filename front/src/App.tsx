import { useEffect, useState } from 'react'
import './App.css'

type backDataType = {
  msg: string;
}

type payType = {
  email: string;
  amount: number;
}

function App() {
  const [backData, setBackData] = useState<backDataType>({msg: ''})
  const [payStackData, setPayStackData] = useState("")

  const paymentRelocate = (url:string) => {
    window.location.href = url
  }

  const checkValidity = () => {
    window.location.href = `http://localhost:8080/verify/${payStackData}`
  }

  const payment = async () => {
    try {
      const response = await fetch(`http://localhost:8080/pay`, {
        method: "POST",
        body: JSON.stringify({
          email: "se@gmail.com",
          amount: 7500
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer token"
        }
      })

      const result = await response.json()
      console.log(result)
      console.log(result.url)
      paymentRelocate(result.url)
      setPayStackData(result.ref)

      if (response.ok) {
        console.log("Payment initialized successfully")
      } else {
        const error = await response.json()
        console.log("Payment failed:", error)
      }
    } catch (err) {
      console.log("Error occurred:", err)
    }
  }

  const monnify_payment = async () => {
    try {
      const response = await fetch("http://localhost:8080/monnify/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: "customer@example.com",
          amount: 7500
        })
      })

      const data = await response.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        console.log("Payment initialization failed:", data.error)
      }
    } catch (err) {
      console.log("Error in monnify payment", err)
    }
  }

  useEffect(() => {
    const backendFetch = async () => {
      const backencResponse = await fetch(`http://localhost:8080/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "access granted"
        }
      })

      const interim = await backencResponse.json()
      setBackData(interim)
      console.log(interim)
    }

    backendFetch()
  }, [])

  return (
    <div className='container w-full border-1 mx-auto rounded-xl'>
    <div className='p-16 w-50vw'>
      <h1 className='text-center'>Paystack Testout</h1>
      <div>{backData.msg}</div>
      <button onClick={() => {payment()}}>Pay</button>
      <br />
      <button onClick={() => {checkValidity()}}>Verify</button>
      <br />
      <button onClick={() => {monnify_payment()}}>Pay with monnify</button>
    </div>
    </div>
  )
}

export default App
