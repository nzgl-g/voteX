"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Save, Trash, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PollOption {
  id: string
  name: string
}

interface PollOptionsProps {
  options: { id: string; name: string }[]
  isEditing: boolean
  onUpdate: (options: { id: string; name: string }[]) => void
}

export function PollOptions({ options, isEditing, onUpdate }: PollOptionsProps) {
  const [pollOptions, setPollOptions] = useState(options)
  
  useEffect(() => {
    if (isEditing) {
      onUpdate(pollOptions)
    }
  }, [pollOptions, isEditing, onUpdate])

  const addOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      name: "",
    }
    setPollOptions([...pollOptions, newOption])
  }

  const removeOption = (id: string) => {
    setPollOptions(pollOptions.filter((option) => option.id !== id))
  }

  const updateOption = (id: string, name: string) => {
    setPollOptions(
      pollOptions.map((option) => (option.id === id ? { ...option, name } : option))
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Poll Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            {pollOptions.map((option) => (
              <div key={option.id} className="flex gap-2 items-center">
                <Input
                  value={option.name}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  placeholder="Enter option name"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeOption(option.id)}
                  className="shrink-0"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              onClick={addOption} 
              className="w-full"
              disabled={pollOptions.length >= 10}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option {pollOptions.length >= 10 && "(Max 10)"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {options.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-muted-foreground">No options added yet</div>
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center p-3 rounded-md bg-muted/50"
                >
                  <div className="h-6 w-6 mr-2 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="font-medium">{option.name}</div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
