import React, { useState, useEffect } from 'react'
import { convertGoogleDriveUrl, getGoogleDriveFallbackUrl, extractGoogleDriveFileId, getGoogleDriveAlternateFallbacks } from '../../src/utils'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  enhancedClassName?: string;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(() => convertGoogleDriveUrl(props.src || ''))
  const [fallbackIndex, setFallbackIndex] = useState(-1)
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Image failed to load:', currentSrc)
    
    const fileId = extractGoogleDriveFileId(props.src || '')
    
    // If this is a Google Drive URL, try multiple fallback strategies
    if (fileId) {
      let urlsToTry = fallbackUrls
      
      // Initialize fallback URLs if not already done
      if (fallbackUrls.length === 0) {
        urlsToTry = [
          getGoogleDriveFallbackUrl(fileId),
          ...getGoogleDriveAlternateFallbacks(fileId)
        ]
        setFallbackUrls(urlsToTry)
        console.log('Initialized fallback URLs for file ID:', fileId, urlsToTry)
      }
      
      // Try next fallback URL
      const nextIndex = fallbackIndex + 1
      if (nextIndex < urlsToTry.length) {
        console.log(`Trying fallback ${nextIndex + 1}/${urlsToTry.length}:`, urlsToTry[nextIndex])
        setFallbackIndex(nextIndex)
        setCurrentSrc(urlsToTry[nextIndex])
        setIsLoading(true)
        return
      }
    }
    
    console.error('All image loading attempts failed for:', props.src)
    console.error('Tried URLs:', [convertGoogleDriveUrl(props.src || ''), ...fallbackUrls])
    setDidError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    console.log('Image loaded successfully:', currentSrc)
    setIsLoading(false)
  }

  // Reset state when src prop changes
  useEffect(() => {
    if (props.src) {
      setCurrentSrc(convertGoogleDriveUrl(props.src))
      setDidError(false)
      setIsLoading(true)
      setFallbackIndex(-1)
      setFallbackUrls([])
    }
  }, [props.src])

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Image loading timeout for:', currentSrc)
        // Try next fallback if available before showing error
        const fileId = extractGoogleDriveFileId(props.src || '')
        if (fileId && fallbackUrls.length > 0) {
          const nextIndex = fallbackIndex + 1
          if (nextIndex < fallbackUrls.length) {
            console.log(`Timeout triggered, trying fallback ${nextIndex + 1}/${fallbackUrls.length}:`, fallbackUrls[nextIndex])
            setFallbackIndex(nextIndex)
            setCurrentSrc(fallbackUrls[nextIndex])
            return // Don't set error, try next fallback
          }
        }
        setDidError(true)
        setIsLoading(false)
      }, 5000) // 5 second timeout for faster fallback
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, currentSrc, fallbackIndex, fallbackUrls, props.src])

  const { src, alt, style, className, enhancedClassName, ...rest } = props

  // Check if this is a circular image (contains rounded-full class)
  const isCircular = className?.includes('rounded-full')
  
  // Enhanced className for circular images to ensure proper containment and face visibility
  const imgClassName = isCircular 
    ? `${className} object-cover object-top`
    : className

  return didError ? (
    <div
      className={`relative bg-primary/20 flex items-center justify-center ${enhancedClassName ?? ''}`}
      style={style}
    >
      <svg className="w-1/3 h-1/3 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  ) : (
    <div className={`relative ${enhancedClassName ?? ''}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      <img 
        src={currentSrc} 
        alt={alt} 
        className={imgClassName} 
        style={isLoading ? { opacity: 0.3, transition: 'opacity 0.3s' } : { opacity: 1, transition: 'opacity 0.3s' }}
        {...rest} 
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}
