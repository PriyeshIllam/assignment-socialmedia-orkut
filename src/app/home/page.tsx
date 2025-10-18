'use client'

import './Home.scss'
import { useAuth } from '@/app/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const STORAGE_BUCKET = 'files' // ✅ Only the bucket name, not a URL

type Profile = {
  id: string
  display_name: string
  photo_url: string | null // stored full public URL
  status_message: string | null
  location: string | null
  user_id?: string
}

/**
 * 🧩 Extract the storage path from a Supabase public URL.
 * Example:
 * https://xyz.supabase.co/storage/v1/object/public/files/images/photo.jpg
 * → returns "images/photo.jpg"
 */
function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const match = publicUrl.match(/object\/public\/[^/]+\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [friends, setFriends] = useState<Profile[]>([])
  const [fetching, setFetching] = useState(true)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('')

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  // Fetch profile + friends
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setFetching(true)

      // 1️⃣ Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed to fetch profile:', error.message)
        if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
          router.push('/create-profile')
          return
        }
        setFetching(false)
        return
      }

      if (!profileData) {
        router.push('/create-profile')
        return
      }

      setProfile(profileData)

      console.log('profileData.photo_url', profileData.photo_url)
      // 2️⃣ Generate signed photo URL (if exists)
      if (profileData.photo_url) {
        const storagePath = getStoragePathFromPublicUrl(profileData.photo_url)
        console.log('storagePath',storagePath)
        if (storagePath) {
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(storagePath, 60 * 60 * 24) // 24 hours

          if (signedError) {
            console.error('Error creating signed URL:', signedError.message)
          } else if (signedUrlData?.signedUrl) {
            setProfilePhotoUrl(signedUrlData.signedUrl)
          }
        } else {
          console.warn('Invalid photo URL, cannot extract storage path.')
        }
      }

      // 3️⃣ Fetch friend suggestions
      const { data: friendData, error: friendError } = await supabase
        .from('suggestions')
        .select('suggested_user_id, profiles!suggested_user_id(*)')
        .eq('user_id', profileData.id)

      if (friendError) {
        console.error('Failed to fetch friends:', friendError.message)
        setFetching(false)
        return
      }

      if (friendData) {
        const friendsList = friendData.map((f: any) => f.profiles)
        setFriends(friendsList)
      }

      setFetching(false)
    }

    fetchData()
  }, [user, router])

  if (loading || fetching) return <p>Loading your Orkut home...</p>
  if (!user || !profile) return null

  return (
    <div className="home-page">
      <div className="sidebar">
        <img
          src={profilePhotoUrl || 'https://placehold.co/200x200?text=No+Photo'}
          alt="Profile"
        />
        <h2>{profile.display_name || 'User'}</h2>
        <p>{profile.location || 'Unknown Location'}</p>
        <p>Status: {profile.status_message || 'Say something...'}</p>
      </div>

      <div className="main">
        <div className="status-box">
          <input
            type="text"
            placeholder="What's on your mind?"
            defaultValue={profile.status_message || ''}
          />
        </div>

        <div className="summary">
          <h3>Profile Summary</h3>
          <ul>
            <li><b>Profile Views:</b> 42</li>
            <li><b>Recent Visitors:</b> Ben, Casey, Ryan</li>
            <li><b>Today's Fortune:</b> “Everyone today is your friend.”</li>
          </ul>
        </div>
      </div>

      <div className="friends">
        <h3>Friend Suggestions</h3>
        {friends.length === 0 && <p>No suggestions right now.</p>}
        {friends.map((f) => (
          <div key={f.id} className="friend">
            <img
              src={f.photo_url || 'https://placekitten.com/60/60'}
              alt="friend"
            />
            <span>{f.display_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
