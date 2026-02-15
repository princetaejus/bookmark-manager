'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Bookmark } from '@/lib/types'

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadBookmarks()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('bookmarks-changes')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Real-time event:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Only add if not already in list (prevents duplicates)
            setBookmarks((current) => {
              const exists = current.some(b => b.id === payload.new.id)
              if (exists) return current
              return [payload.new as Bookmark, ...current]
            })
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((current) => current.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [userId])

  const loadBookmarks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    setUserId(user.id)

    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setBookmarks(data)
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    // 1. OPTIMISTIC UPDATE: Remove from UI immediately
    setBookmarks((current) => current.filter((b) => b.id !== id))
    
    // 2. Then delete from database
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    
    // 3. If delete failed, reload bookmarks to restore UI
    if (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete bookmark')
      loadBookmarks() // Restore the bookmark in UI
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">No bookmarks yet. Add your first one above!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg divide-y">
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="p-4 hover:bg-gray-50 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{bookmark.title}</h3>
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-600 hover:underline truncate block"
            >
              {bookmark.url}
            </a>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(bookmark.created_at).toLocaleDateString()}
            </p>
          </div>
          <button 
            onClick={() => handleDelete(bookmark.id)} 
            className="text-red-600 hover:text-red-800 p-2" 
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}