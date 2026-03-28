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
  const [loading, setLoading] = useState<boolean>(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
      const apiKey = import.meta.env.VITE_API_KEY || "learn"
      
      const res = await fetch(`${backendUrl}/users?key=${apiKey}`, {
        credentials: "include"
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const json: ApiResponse<User[]> = await res.json()
      setUsers(json.data ?? [])
    } catch (error) {
      console.error("User List Error:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="flex items-center justify-center p-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <CardTitle className="text-2xl font-bold">User List</CardTitle>
          <Button 
            onClick={loadUsers} 
            disabled={loading}
            variant="outline"
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    {loading ? "Fetching data..." : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}