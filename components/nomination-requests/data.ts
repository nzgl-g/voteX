export type CandidateStatus = "approved" | "pending" | "declined" | "rejected"

export interface Attachment {
  name: string
  size: string
  url: string
}

export interface Candidate {
  id: string
  fullName: string
  email: string
  dateOfBirth: string
  placeOfBirth: string
  nationalities: string[]
  experience: string
  biography: string
  promises: string[]
  status: CandidateStatus
  attachments: Attachment[]
}