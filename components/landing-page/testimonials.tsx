"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Testimonial {
  id: number
  name: string
  role: string
  quote: string
  image: string
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Product Manager",
      quote:
        "YourVote transformed our product planning meetings. Decisions that used to take days now happen in minutes.",
      image: "/placeholder.svg?height=48&width=48",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Team Lead",
      quote: "The real-time results feature is a game-changer for our remote team. Everyone feels heard and included.",
      image: "/placeholder.svg?height=48&width=48",
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "Community Organizer",
      quote:
        "We use YourVote for everything from board elections to deciding on event themes. It's incredibly versatile.",
      image: "/placeholder.svg?height=48&width=48",
    },
    {
      id: 4,
      name: "James Wilson",
      role: "Department Head",
      quote: "The security features give us peace of mind when conducting sensitive departmental votes.",
      image: "/placeholder.svg?height=48&width=48",
    },
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToSlide = (index: number) => {
    setActiveIndex(index)
  }

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide()
      }, 8000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused])

  return (
    <section className="py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">What Our Users Say</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Join thousands of teams making better decisions with YourVote.
          </p>
        </div>

        <div
          className="relative mx-auto mt-12 max-w-4xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="overflow-hidden rounded-lg bg-background p-6 shadow-lg">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              aria-live="polite"
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="min-w-full flex-shrink-0 px-4"
                  aria-hidden={activeIndex !== testimonial.id - 1}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <blockquote className="mt-4">
                      <p className="text-lg font-medium italic">"{testimonial.quote}"</p>
                    </blockquote>
                    <div className="mt-2">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-background p-2 shadow-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-background p-2 shadow-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="mt-4 flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 w-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary",
                  index === activeIndex ? "bg-primary" : "bg-muted",
                )}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
