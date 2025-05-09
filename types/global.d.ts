interface Window {
    ethereum?: {
        isMetaMask?: boolean
        request: (request: { method: string; params?: any[] }) => Promise<any>
    }
}
