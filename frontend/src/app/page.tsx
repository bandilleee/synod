import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl text-white">Synod</CardTitle>
          <CardDescription>
            Frontend is running successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-zinc-500 space-y-2">
            <div className="flex justify-between">
              <span>Next.js</span>
              <span className="text-zinc-300">Ready</span>
            </div>
            <div className="flex justify-between">
              <span>Tailwind CSS</span>
              <span className="text-zinc-300">Ready</span>
            </div>
            <div className="flex justify-between">
              <span>shadcn/ui</span>
              <span className="text-zinc-300">Ready</span>
            </div>
            <div className="flex justify-between">
              <span>React Query</span>
              <span className="text-zinc-300">Ready</span>
            </div>
          </div>
          <Button className="w-full" variant="outline">
            Phase 2 Complete
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
