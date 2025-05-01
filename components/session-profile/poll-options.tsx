"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn-ui/table"
import { Edit, Plus, Save, Trash, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PollOption {
  id: string
  name: string
}

interface PollOptionsProps {
  options: PollOption[]
  onUpdate: (options: PollOption[]) => void
}

export function PollOptions({ options, onUpdate }: PollOptionsProps) {
  const [pollOptions, setPollOptions] = useState<PollOption[]>(options)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newOption, setNewOption] = useState("")

  const handleEdit = (option: PollOption) => {
    setEditingId(option.id)
    setEditValue(option.name)
  }

  const handleSave = (id: string) => {
    if (editValue.trim() === "") {
      toast({
        title: "Error",
        description: "Option name cannot be empty",
        variant: "destructive",
      })
      return
    }

    const updatedOptions = pollOptions.map((option) => (option.id === id ? { ...option, name: editValue } : option))
    setPollOptions(updatedOptions)
    onUpdate(updatedOptions)
    setEditingId(null)
    setEditValue("")

    toast({
      title: "Option updated",
      description: "Poll option has been updated successfully.",
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue("")
  }

  const handleDelete = (id: string) => {
    const updatedOptions = pollOptions.filter((option) => option.id !== id)
    setPollOptions(updatedOptions)
    onUpdate(updatedOptions)

    toast({
      title: "Option deleted",
      description: "Poll option has been deleted successfully.",
    })
  }

  const handleAddOption = () => {
    if (newOption.trim() === "") {
      toast({
        title: "Error",
        description: "Option name cannot be empty",
        variant: "destructive",
      })
      return
    }

    const newId = `opt${Date.now()}`
    const updatedOptions = [...pollOptions, { id: newId, name: newOption }]
    setPollOptions(updatedOptions)
    onUpdate(updatedOptions)
    setNewOption("")

    toast({
      title: "Option added",
      description: "New poll option has been added successfully.",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Poll Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new option"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddOption}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option Name</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pollOptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No options available. Add your first option above.
                    </TableCell>
                  </TableRow>
                ) : (
                  pollOptions.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>
                        {editingId === option.id ? (
                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                        ) : (
                          option.name
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === option.id ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleSave(option.id)}>
                              <Save className="h-4 w-4" />
                              <span className="sr-only">Save</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancel}>
                              <X className="h-4 w-4" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(option)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(option.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
