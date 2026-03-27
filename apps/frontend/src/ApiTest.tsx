import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ApiResponse, HealthCheck } from "shared";

function App() {
  const [response, setResponse] = useState<string>("")

  const handleClick = async () => {
    try {
      // GANTI localhost ke Environment Variable
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const res = await fetch(`${backendUrl}`)
      const data: ApiResponse<HealthCheck> = await res.json()

      // TAMBAHKAN tanda tanya (?.) untuk keamanan data
      if (data && data.data) {
        setResponse(data.data.status)
      } else {
        setResponse("No data status found")
      }
    } catch (error) {
      console.error(error)
      setResponse("Error connecting to server")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Button onClick={handleClick}>
        Get Response
      </Button>
      <div className="p-4 border rounded w-96">
        <b>Server Response:</b>
        <p>{response}</p>
      </div>
    </div>
  )
}

export default App