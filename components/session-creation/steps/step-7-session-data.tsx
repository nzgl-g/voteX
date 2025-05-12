"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import type { FormData, PollOption, Candidate } from "../voting-session-form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, Edit, Save, X, Info, Users, ListChecks } from "lucide-react"

interface Step7Props {
    formData: FormData
    updateFormData: (data: Partial<FormData>) => void
}

export default function Step7SessionData({ formData, updateFormData }: Step7Props) {
    const [newOption, setNewOption] = useState<Partial<PollOption>>({ title: "", description: "" })
    const [newCandidate, setNewCandidate] = useState<Partial<Candidate>>({ name: "", biography: "" })
    const [editingOption, setEditingOption] = useState<string | null>(null)
    const [editingCandidate, setEditingCandidate] = useState<string | null>(null)
    const [editData, setEditData] = useState<Partial<PollOption> | Partial<Candidate>>({})

    // Poll options handlers
    const addPollOption = () => {
        if (newOption.title) {
            const option: PollOption = {
                id: uuidv4(),
                title: newOption.title,
                description: newOption.description || "",
            }
            updateFormData({ pollOptions: [...formData.pollOptions, option] })
            setNewOption({ title: "", description: "" })
        }
    }

    const updatePollOption = (id: string) => {
        if (editData.title) {
            const updatedOptions = formData.pollOptions.map((option) =>
                option.id === id
                    ? {
                        ...option,
                        title: editData.title as string,
                        description: editData.description as string,
                    }
                    : option,
            )
            updateFormData({ pollOptions: updatedOptions })
            setEditingOption(null)
            setEditData({})
        }
    }

    const deletePollOption = (id: string) => {
        const updatedOptions = formData.pollOptions.filter((option) => option.id !== id)
        updateFormData({ pollOptions: updatedOptions })
    }

    const startEditingOption = (option: PollOption) => {
        setEditingOption(option.id)
        setEditData({ title: option.title, description: option.description })
    }

    // Candidate handlers
    const addCandidate = () => {
        if (newCandidate.name) {
            const candidate: Candidate = {
                id: uuidv4(),
                name: newCandidate.name,
                biography: newCandidate.biography || "",
            }
            updateFormData({ candidates: [...formData.candidates, candidate] })
            setNewCandidate({ name: "", biography: "" })
        }
    }

    const updateCandidate = (id: string) => {
        if (editData.name) {
            const updatedCandidates = formData.candidates.map((candidate) =>
                candidate.id === id
                    ? {
                        ...candidate,
                        name: editData.name as string,
                        biography: editData.biography as string,
                    }
                    : candidate,
            )
            updateFormData({ candidates: updatedCandidates })
            setEditingCandidate(null)
            setEditData({})
        }
    }

    const deleteCandidate = (id: string) => {
        const updatedCandidates = formData.candidates.filter((candidate) => candidate.id !== id)
        updateFormData({ candidates: updatedCandidates })
    }

    const startEditingCandidate = (candidate: Candidate) => {
        setEditingCandidate(candidate.id)
        setEditData({ name: candidate.name, biography: candidate.biography })
    }

    // Render content based on voting type
    const renderContent = () => {
        if (formData.voteType === "poll") {
            return (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <ListChecks className="h-6 w-6 text-purple-500" />
                        <h3 className="text-xl font-medium">Poll Options</h3>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <p className="text-sm">
                            Add options for voters to choose from. Each option should have a clear title and optional description.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Add New Option</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="option-title">Option Title</Label>
                                <Input
                                    id="option-title"
                                    value={newOption.title}
                                    onChange={(e) => setNewOption({ ...newOption, title: e.target.value })}
                                    placeholder="Enter option title"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="option-description">Description (Optional)</Label>
                                <Textarea
                                    id="option-description"
                                    value={newOption.description}
                                    onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
                                    placeholder="Enter a brief description of this option"
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={addPollOption}
                                disabled={!newOption.title}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Option
                            </Button>
                        </CardFooter>
                    </Card>

                    {formData.pollOptions.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="font-medium">Added Options ({formData.pollOptions.length})</h3>
                            <ScrollArea className="h-[300px] rounded-md border">
                                <div className="p-4 space-y-4">
                                    {formData.pollOptions.map((option) => (
                                        <Card key={option.id} className={editingOption === option.id ? "border-purple-500" : ""}>
                                            <CardContent className="p-4">
                                                {editingOption === option.id ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <Label htmlFor={`edit-title-${option.id}`}>Title</Label>
                                                            <Input
                                                                id={`edit-title-${option.id}`}
                                                                value={editData.title}
                                                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`edit-desc-${option.id}`}>Description</Label>
                                                            <Textarea
                                                                id={`edit-desc-${option.id}`}
                                                                value={editData.description}
                                                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-2 mt-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingOption(null)
                                                                    setEditData({})
                                                                }}
                                                            >
                                                                <X className="mr-1 h-4 w-4" /> Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updatePollOption(option.id)}
                                                                disabled={!editData.title}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <Save className="mr-1 h-4 w-4" /> Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-medium">{option.title}</h4>
                                                                {option.description && (
                                                                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => startEditingOption(option)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deletePollOption(option.id)}
                                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Delete</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="text-center p-8 border border-dashed rounded-lg">
                            <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-500">No options added yet</h3>
                            <p className="text-sm text-gray-400 mt-1">Add at least one option for your poll</p>
                        </div>
                    )}
                </div>
            )
        } else if (formData.voteType === "election") {
            if (formData.hasNomination) {
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-500" />
                            <h3 className="text-xl font-medium">Nomination Phase</h3>
                        </div>

                        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                            <Info className="h-4 w-4 text-blue-500" />
                            <AlertTitle>Nomination Phase Enabled</AlertTitle>
                            <AlertDescription className="mt-2">
                                <p>
                                    You've enabled a nomination phase for this election. During this phase, candidates can submit their
                                    applications to participate in the election.
                                </p>
                                <p className="mt-2">
                                    As the election administrator, you'll be able to review and approve candidate nominations before the
                                    voting phase begins.
                                </p>
                                <p className="mt-2">
                                    The nomination phase will run from{" "}
                                    <strong>
                                        {formData.nominationStartDate?.toLocaleDateString()} to{" "}
                                        {formData.nominationEndDate?.toLocaleDateString()}
                                    </strong>
                                    .
                                </p>
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Nomination Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">What candidates will need to provide:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Full name</li>
                                        <li>Contact information</li>
                                        <li>Biography or statement</li>
                                        <li>Optional profile photo</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">During the nomination phase, you'll be able to:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Review candidate applications</li>
                                        <li>Approve or reject nominations</li>
                                        <li>Request additional information from candidates</li>
                                        <li>Communicate with nominees</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 border border-dashed rounded-lg text-center">
                            <p className="text-gray-500">
                                After creating this election, you'll be able to share a nomination link with potential candidates.
                            </p>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-500" />
                            <h3 className="text-xl font-medium">Election Candidates</h3>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm">
                                Add candidates for your election. Each candidate should have a name and biography or statement.
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Add New Candidate</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="candidate-name">Candidate Name</Label>
                                    <Input
                                        id="candidate-name"
                                        value={newCandidate.name}
                                        onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                                        placeholder="Enter candidate's full name"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="candidate-bio">Biography / Statement</Label>
                                    <Textarea
                                        id="candidate-bio"
                                        value={newCandidate.biography}
                                        onChange={(e) => setNewCandidate({ ...newCandidate, biography: e.target.value })}
                                        placeholder="Enter candidate's biography or statement"
                                        className="mt-1 min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={addCandidate}
                                    disabled={!newCandidate.name}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Candidate
                                </Button>
                            </CardFooter>
                        </Card>

                        {formData.candidates.length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="font-medium">Added Candidates ({formData.candidates.length})</h3>
                                <ScrollArea className="h-[300px] rounded-md border">
                                    <div className="p-4 space-y-4">
                                        {formData.candidates.map((candidate) => (
                                            <Card key={candidate.id} className={editingCandidate === candidate.id ? "border-blue-500" : ""}>
                                                <CardContent className="p-4">
                                                    {editingCandidate === candidate.id ? (
                                                        <div className="space-y-3">
                                                            <div>
                                                                <Label htmlFor={`edit-name-${candidate.id}`}>Name</Label>
                                                                <Input
                                                                    id={`edit-name-${candidate.id}`}
                                                                    value={editData.name}
                                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`edit-bio-${candidate.id}`}>Biography</Label>
                                                                <Textarea
                                                                    id={`edit-bio-${candidate.id}`}
                                                                    value={editData.biography}
                                                                    onChange={(e) => setEditData({ ...editData, biography: e.target.value })}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingCandidate(null)
                                                                        setEditData({})
                                                                    }}
                                                                >
                                                                    <X className="mr-1 h-4 w-4" /> Cancel
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateCandidate(candidate.id)}
                                                                    disabled={!editData.name}
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    <Save className="mr-1 h-4 w-4" /> Save
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium">{candidate.name}</h4>
                                                                    {candidate.biography && (
                                                                        <p className="text-sm text-gray-500 mt-1">{candidate.biography}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => startEditingCandidate(candidate)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        <span className="sr-only">Edit</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => deleteCandidate(candidate.id)}
                                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span className="sr-only">Delete</span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            <div className="text-center p-8 border border-dashed rounded-lg">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-500">No candidates added yet</h3>
                                <p className="text-sm text-gray-400 mt-1">Add at least one candidate for your election</p>
                            </div>
                        )}
                    </div>
                )
            }
        }

        return (
            <div className="text-center p-12">
                <p className="text-gray-500">Please select a voting type first</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Session Data</h2>
            {renderContent()}
        </div>
    )
}
