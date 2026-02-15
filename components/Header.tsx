import { User } from '@/lib/types'

export default function Header({ user }: { user: User }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-bold text-gray-800">Bookmark Manager</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full" />
            )}
            <span className="text-sm text-gray-600">{user.user_metadata?.full_name || user.email}</span>
          </div>
          <form action="/auth/logout" method="post">
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-800">Sign Out</button>
          </form>
        </div>
      </div>
    </header>
  )
}