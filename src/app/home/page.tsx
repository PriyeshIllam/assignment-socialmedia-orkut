'use client'

import './Home.scss'
import { useAuth } from '@/app/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const STORAGE_BUCKET = 'files'

type Profile = {
  id: string
  display_name: string
  photo_url: string | null
  status_message: string | null
  location: string | null
}

type Post = {
  id: string
  user_id: string
  title: string
  slug: string
  content: string | null
  image_url: string | null
  created_at: string
  profiles?: Profile
}

function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const match = publicUrl.match(/object\/public\/[^/]+\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

async function getSignedUrlFromPublicUrl(publicUrl: string): Promise<string | null> {
  if (!publicUrl) return null
  const storagePath = getStoragePathFromPublicUrl(publicUrl)
  if (!storagePath) return publicUrl

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24)

  if (error) {
    console.warn('Signed URL failed:', error.message)
    return publicUrl
  }

  return data?.signedUrl || publicUrl
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now()
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [friends, setFriends] = useState<Profile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [fetching, setFetching] = useState(true)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('')

  // Post creation form
  const [postTitle, setPostTitle] = useState('')
  const [postText, setPostText] = useState('')
  const [postImage, setPostImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Editing
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editText, setEditText] = useState('')
  const [editImage, setEditImage] = useState<File | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setFetching(true)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        router.push('/create-profile')
        return
      }
      setProfile(profileData)

      if (profileData.photo_url) {
        const signed = await getSignedUrlFromPublicUrl(profileData.photo_url)
        if (signed) setProfilePhotoUrl(signed)
      }

      // Load friends
      const { data: friendData } = await supabase
        .from('suggestions')
        .select('suggested_user_id, profiles!suggested_user_id(*)')
        .eq('user_id', profileData.id)

      if (friendData) {
        setFriends(friendData.map((f: any) => f.profiles))
      }

      await refreshPosts()
      setFetching(false)
    }

    fetchData()
  }, [user, router])

  const handleImageUpload = async (imageFile: File): Promise<string | null> => {
    if (!imageFile) return null
    setUploading(true)
    const ext = imageFile.name.split('.').pop()
    const fileName = `${user!.id}-${Date.now()}.${ext}`
    const filePath = `posts/${fileName}`

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, imageFile)

    if (error) {
      console.error('Upload failed:', error.message)
      setUploading(false)
      return null
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    setUploading(false)
    return publicUrlData?.publicUrl || null
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postTitle.trim() || !postText.trim()) {
      alert('Please provide both a title and content.')
      return
    }

    const imageUrl = postImage ? await handleImageUpload(postImage) : null
    const slug = generateSlug(postTitle)

    const { error } = await supabase.from('posts').insert({
      user_id: user!.id,
      title: postTitle.trim(),
      slug,
      content: postText.trim(),
      image_url: imageUrl,
    })

    if (error) {
      console.error('Post creation failed:', error.message)
      alert('Failed to create post!')
      return
    }

    setPostTitle('')
    setPostText('')
    setPostImage(null)
    await refreshPosts()
  }

  const refreshPosts = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })

    if (postsData) {
      const signedPosts = await Promise.all(
        postsData.map(async (p) => {
          const signedImageUrl = p.image_url
            ? await getSignedUrlFromPublicUrl(p.image_url)
            : null
          const signedProfilePhoto =
            p.profiles?.photo_url
              ? await getSignedUrlFromPublicUrl(p.profiles.photo_url)
              : null
          return {
            ...p,
            image_url: signedImageUrl,
            profiles: { ...p.profiles, photo_url: signedProfilePhoto },
          }
        })
      )
      setPosts(signedPosts)
    }
  }

  const startEditing = (post: Post) => {
    setEditingPostId(post.id)
    setEditTitle(post.title)
    setEditText(post.content || '')
    setEditImage(null)
  }

  const handleUpdatePost = async (postId: string) => {
    let imageUrl = null
    if (editImage) {
      imageUrl = await handleImageUpload(editImage)
    }

    const { error } = await supabase
      .from('posts')
      .update({
        title: editTitle.trim(),
        content: editText.trim(),
        ...(imageUrl && { image_url: imageUrl }),
      })
      .eq('id', postId)

    if (error) {
      console.error('Update failed:', error.message)
      alert('Failed to update post!')
      return
    }

    setEditingPostId(null)
    await refreshPosts()
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      console.error('Delete failed:', error.message)
      alert('Failed to delete post!')
      return
    }

    await refreshPosts()
  }

  if (loading || fetching) return <p>Loading your Orkut home...</p>
  if (!user || !profile) return null

  return (
    <div className="home-page">
      <div className="sidebar">
        <img
          src={profilePhotoUrl || 'https://placehold.co/200x200?text=No+Photo'}
          alt="Profile"
        />
        <h2>{profile.display_name}</h2>
        <p>{profile.location || 'Unknown Location'}</p>
        <p>Status: {profile.status_message || 'Say something...'}</p>
      </div>

      <div className="main">
        {/* Create Post */}
        <div className="post-box">
          <h3>What’s new, {profile.display_name.split(' ')[0]}?</h3>
          <form onSubmit={handleCreatePost}>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post title"
            />
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Share your thoughts..."
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPostImage(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={uploading}>
              {uploading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>

        {/* Feed */}
        <div className="feed">
          <h3>Recent Updates</h3>
          {posts.length === 0 && <p>No posts yet. Be the first!</p>}
          {posts.map((p) => (
            <div key={p.id} className="post-card">
              <div className="post-header">
                <img
                  src={p.profiles?.photo_url || 'https://placekitten.com/60/60'}
                  alt="user"
                />
                <div>
                  <strong>{p.profiles?.display_name || 'Unknown User'}</strong>
                  <span>{new Date(p.created_at).toLocaleString()}</span>
                </div>
                {p.user_id === user!.id && (
                  <div className="post-actions">
                    <button onClick={() => startEditing(p)}>✏️ Edit</button>
                    <button onClick={() => handleDeletePost(p.id)}>🗑️ Delete</button>
                  </div>
                )}
              </div>

              {editingPostId === p.id ? (
                <div className="edit-box">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleUpdatePost(p.id)}>💾 Save</button>
                    <button onClick={() => setEditingPostId(null)}>❌ Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="post-title">{p.title}</h4>
                  {p.content && <p className="post-text">{p.content}</p>}
                  {p.image_url && (
                    <img src={p.image_url} alt="post" className="post-image" />
                  )}
                </>
              )}
            </div>
          ))}
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
