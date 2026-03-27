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

  const loadUsers = async () => {
    try {
      // GANTI localhost ke Environment Variable
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const res = await fetch(`${backendUrl}/users`)
      const data: ApiResponse<User[]> = await res.json()

      // GUNAKAN ?? [] supaya kalau data kosong, tetap jadi array kosong (tidak undefined)
      setUsers(data?.data ?? [])
    } catch (error) {
      console.error("Failed to load users", error)
      setUsers([]) // Set kosong jika error
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="flex justify-center p-10">
      <Card className="w-[600px]"> {/* Perbaikan penulisan w-150 ke w-[600px] */}
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