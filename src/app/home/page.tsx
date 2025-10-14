'use client'

import './Home.scss'
import { useAuth } from '@/app/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  display_name: string
  photo_url: string | null
  status_message: string | null
  location: string | null
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [friends, setFriends] = useState<Profile[]>([])

  // Redirect only after loading finishes
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  console.log('user--', user)
  // Fetch profile and friends only when user exists
  

  //
  useEffect(() => {
    if (!user) return
    console.log('calling')

    
    const fetchData = async () => {
      // get profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Failed to fetch profile:', error)
        return
      }

      setProfile(profileData)

      // get friend suggestions
      const { data: friendData, error: friendError } = await supabase
        .from('suggestions')
        .select('suggested_user_id, profiles!suggested_user_id(*)')
        .eq('user_id', profileData.id)

      if (friendError) {
        console.error('Failed to fetch friends:', friendError)
        return
      }

      if (friendData) {
        const friendsList = friendData.map((f: any) => f.profiles)
        setFriends(friendsList)
      }
    }

    fetchData()
  }, [user])

  if (loading) return <p>Loading...</p>
  if (!user) return null
  if (!profile) return <p>Loading your Orkut home...</p>

  return (
    <div className="home-page">
      <div className="sidebar">
        <img src={profile.photo_url || 'https://placekitten.com/200/200'} alt="Profile" />
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
            <img src={f.photo_url || 'https://placekitten.com/60/60'} alt="friend" />
            <span>{f.display_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
