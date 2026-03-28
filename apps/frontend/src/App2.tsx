import { useEffect, useState } from "react"
import type { User, ApiResponse } from "shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  // PINDAHKAN KE SINI:
  const [debugMessage, setDebugMessage] = useState<string>("Initializing...")

  const loadUsers = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
      const apiKey = import.meta.env.VITE_API_KEY || "learn"
      
      setDebugMessage(`Mencoba fetch ke: ${backendUrl}/users?key=${apiKey}`)
      
      const res = await fetch(`${backendUrl}/users?key=${apiKey}`, {
        credentials: "include" // Penting untuk Phase 3 & 4
      })

      if (!res.ok) {
        setDebugMessage(`Gagal! Status: ${res.status}. Cek API Key di Vercel.`);
        return;
      }

      const json: ApiResponse<User[]> = await res.json()
      
      if (json.data && json.data.length > 0) {
        setUsers(json.data)
        setDebugMessage(`Berhasil! Ditemukan ${json.data.length} user.`)
      } else {
        setUsers([])
        setDebugMessage("Berhasil konek, tapi data di database KOSONG.")
      }
    } catch (error: any) {
      setDebugMessage(`Koneksi Error: ${error.message}. Pastikan URL Backend benar & HTTPS.`)
      setUsers([])
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-10 gap-4">
      {/* Tampilan Debug Info */}
      <div className="w-150 p-2 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono break-all">
        <span className="font-bold text-blue-600">Debug Log:</span> {debugMessage}
      </div>

      <Card className="w-150">
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadUsers} className="mb-4">
            Refresh
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}