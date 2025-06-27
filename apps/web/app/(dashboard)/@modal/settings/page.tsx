import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui"

export default function SettingsModal() {
    return (
        <Dialog open={true}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Settings Modal</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    <p>This is a parallel route modal for settings.</p>
                    <p>Opens alongside the main content without navigation.</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
