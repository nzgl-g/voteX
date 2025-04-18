"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn-ui/button"
import { Input } from "@/components/shadcn-ui/input"
import { Label } from "@/components/shadcn-ui/label"
import { Checkbox } from "@/components/shadcn-ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { PlusCircle, Save, Trash2, ShieldCheck } from "lucide-react"
import { ScrollArea } from "@/components/shadcn-ui/scroll-area"
import { Card, CardContent } from "@/components/shadcn-ui/card"

// Mock data for roles and permissions
const initialRoles = [
  {
    id: "1",
    name: "Team Leader",
    description: "Full access to all features",
    permissions: {
      members: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, create: true, edit: true, delete: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, export: true },
    },
  },
  {
    id: "2",
    name: "Validator",
    description: "Can validate and review work",
    permissions: {
      members: { view: true, create: false, edit: false, delete: false },
      roles: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      reports: { view: true, create: true, export: false },
    },
  },
  {
    id: "3",
    name: "Support",
    description: "Limited access for support tasks",
    permissions: {
      members: { view: true, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: false, export: false },
    },
  },
  {
    id: "4",
    name: "Auditor",
    description: "View-only access for auditing",
    permissions: {
      members: { view: true, create: false, edit: false, delete: false },
      roles: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: false, export: true },
    },
  },
]

export default function RolesPermissions() {
  const [roles, setRoles] = useState(initialRoles)
  const [activeRole, setActiveRole] = useState(roles[0].id)
  const [editMode, setEditMode] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")

  const currentRole = roles.find((role) => role.id === activeRole)

  const handlePermissionChange = (module, permission, checked) => {
    setRoles(
      roles.map((role) => {
        if (role.id === activeRole) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [module]: {
                ...role.permissions[module],
                [permission]: checked,
              },
            },
          }
        }
        return role
      }),
    )
  }

  const handleSaveRole = () => {
    setEditMode(false)
    // Here you would typically save the role changes to your backend
    console.log("Saving role changes:", currentRole)
  }

  const handleAddNewRole = () => {
    if (newRoleName.trim() === "") return

    const newRole = {
      id: `${roles.length + 1}`,
      name: newRoleName,
      description: newRoleDescription,
      permissions: {
        members: { view: false, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        tasks: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, export: false },
      },
    }

    setRoles([...roles, newRole])
    setActiveRole(newRole.id)
    setNewRoleName("")
    setNewRoleDescription("")
    setEditMode(true)
  }

  const handleDeleteRole = (roleId) => {
    if (roles.length <= 1) return

    const newRoles = roles.filter((role) => role.id !== roleId)
    setRoles(newRoles)

    if (roleId === activeRole) {
      setActiveRole(newRoles[0].id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""} available
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <Button onClick={handleSaveRole} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
              Edit Role
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:gap-4">
        {/* Role selection and creation */}
        <Card className="w-full md:w-64 flex-shrink-0">
          <CardContent className="p-4">
            <div className="font-medium mb-2 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-cyan-500" />
              Available Roles
            </div>
            <ScrollArea className="h-[180px] rounded-md border p-2 mb-4">
              <div className="space-y-1">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                      role.id === activeRole ? "bg-primary text-primary-foreground" : "hover:bg-muted transition-colors"
                    }`}
                    onClick={() => setActiveRole(role.id)}
                  >
                    <span className="truncate">{role.name}</span>
                    {roles.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 flex-shrink-0 ${
                          role.id === activeRole
                            ? "text-primary-foreground hover:text-primary-foreground hover:bg-primary/90"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRole(role.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-2 border-t">
              <div className="font-medium mb-2">Add New Role</div>
              <div className="space-y-2">
                <Input placeholder="Role Name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                <Input
                  placeholder="Role Description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
                <Button onClick={handleAddNewRole} className="w-full" variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions editor */}
        <Card className="w-full flex-grow">
          <CardContent className="p-4">
            {currentRole && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{currentRole.name}</h3>
                  <p className="text-muted-foreground text-sm">{currentRole.description}</p>
                </div>

                <Tabs defaultValue="members" className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>

                  <TabsContent value="members" className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="members-view"
                            checked={currentRole.permissions.members.view}
                            onCheckedChange={(checked) => handlePermissionChange("members", "view", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="members-view">View Members</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="members-create"
                            checked={currentRole.permissions.members.create}
                            onCheckedChange={(checked) => handlePermissionChange("members", "create", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="members-create">Create Members</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="members-edit"
                            checked={currentRole.permissions.members.edit}
                            onCheckedChange={(checked) => handlePermissionChange("members", "edit", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="members-edit">Edit Members</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="members-delete"
                            checked={currentRole.permissions.members.delete}
                            onCheckedChange={(checked) => handlePermissionChange("members", "delete", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="members-delete">Delete Members</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="roles" className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="roles-view"
                            checked={currentRole.permissions.roles.view}
                            onCheckedChange={(checked) => handlePermissionChange("roles", "view", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="roles-view">View Roles</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="roles-create"
                            checked={currentRole.permissions.roles.create}
                            onCheckedChange={(checked) => handlePermissionChange("roles", "create", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="roles-create">Create Roles</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="roles-edit"
                            checked={currentRole.permissions.roles.edit}
                            onCheckedChange={(checked) => handlePermissionChange("roles", "edit", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="roles-edit">Edit Roles</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="roles-delete"
                            checked={currentRole.permissions.roles.delete}
                            onCheckedChange={(checked) => handlePermissionChange("roles", "delete", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="roles-delete">Delete Roles</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tasks" className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tasks-view"
                            checked={currentRole.permissions.tasks.view}
                            onCheckedChange={(checked) => handlePermissionChange("tasks", "view", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="tasks-view">View Tasks</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tasks-create"
                            checked={currentRole.permissions.tasks.create}
                            onCheckedChange={(checked) => handlePermissionChange("tasks", "create", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="tasks-create">Create Tasks</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tasks-edit"
                            checked={currentRole.permissions.tasks.edit}
                            onCheckedChange={(checked) => handlePermissionChange("tasks", "edit", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="tasks-edit">Edit Tasks</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tasks-delete"
                            checked={currentRole.permissions.tasks.delete}
                            onCheckedChange={(checked) => handlePermissionChange("tasks", "delete", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="tasks-delete">Delete Tasks</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reports" className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="reports-view"
                            checked={currentRole.permissions.reports.view}
                            onCheckedChange={(checked) => handlePermissionChange("reports", "view", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="reports-view">View Reports</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="reports-create"
                            checked={currentRole.permissions.reports.create}
                            onCheckedChange={(checked) => handlePermissionChange("reports", "create", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="reports-create">Create Reports</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="reports-export"
                            checked={currentRole.permissions.reports.export}
                            onCheckedChange={(checked) => handlePermissionChange("reports", "export", checked)}
                            disabled={!editMode}
                          />
                          <Label htmlFor="reports-export">Export Reports</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
