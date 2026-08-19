import { useEffect, useState, type ReactNode } from "react"
import { addPropertyControls, ControlType } from "framer"

const API_BASE_URL = "https://syncsphere-hiv6.onrender.com"

type Course = {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

type CountryResponse = {
    country_code: "IN" | "US"
}

type CoursesProps = {
    cardRadius: number
    cardBackground: string
}

// One font stack, reused everywhere — previously only the status panels
// declared this, so the actual course grid silently inherited whatever
// font the host page happened to use.
const FONT_STACK =
    'Outfit, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

// ── Static styles, hoisted out of the component ──────────────────────────
const STATUS_STYLES = `
    .courses-status-wrapper {
        width: 100%;
        height: 100%;
        min-height: 100%;
        min-width: 0;
        box-sizing: border-box;
        display: grid;
        place-items: center;
        background: #f6f3ff;
        padding: 24px;
    }
    .courses-status-panel {
        width: min(560px, 100%);
        border-radius: 20px;
        border: 1px solid #ddd6ff;
        background: #ffffff;
        box-shadow: 0 10px 30px rgba(53, 43, 125, 0.08);
        padding: 28px 24px;
        box-sizing: border-box;
        text-align: center;
        font-family: ${FONT_STACK};
    }
    .courses-status-eyebrow {
        margin: 0 0 10px;
        color: #6547ff;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
    .courses-status-title {
        margin: 0 0 8px;
        color: #121a4d;
        font-weight: 700;
        font-size: 24px;
        line-height: 1.2;
    }
    .courses-status-description {
        margin: 0;
        color: #73778c;
        font-size: 14px;
        line-height: 1.4;
    }
    .courses-status-retry {
        border: none;
        outline: none;
        background: #6547ff;
        color: white;
        border-radius: 16px;
        padding: 15px 20px;
        font-family: ${FONT_STACK};
        font-size: 14px;
        font-weight: 600;
        margin-top: 12px;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    .courses-status-retry:hover { background: #5539e0; }
    @media (max-width: 639px) {
        .courses-status-wrapper { padding: 12px; }
    }
`

const GRID_STYLES = `
    .courses-root {
        width: 100%;
        height: 100%;
        min-width: 0;
        box-sizing: border-box;
        font-family: ${FONT_STACK};
    }
    .courses-notice {
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 16px;
        padding: 8px 12px;
        border-radius: 10px;
        background: #fff7e6;
        border: 1px solid #ffe1a8;
        color: #946200;
        font-size: 12px;
    }
    .courses-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        box-sizing: border-box;
    }
    @media (max-width: 1023px) {
        .courses-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 639px) {
        .courses-grid { grid-template-columns: minmax(0, 1fr); }
    }
    .course-card {
        min-width: 0;
        background: #ffffff;
        border-radius: 16px;
        padding: 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        min-height: 156px;
        box-shadow: 0 8px 24px rgba(31, 35, 72, 0.06);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .course-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(31, 35, 72, 0.1);
    }
    .pill {
        width: fit-content;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
    }
    .course-category { color: #6547ff; background: #f0edff; margin-bottom: 12px; }
    .refundable-badge { color: #2f7a4f; background: #e7f6ec; }
    .course-title {
        margin: 0 0 8px;
        color: #121a4d;
        font-size: 17px;
        line-height: 1.2;
        font-weight: 700;
        overflow-wrap: anywhere;
    }
    .course-description {
        margin: 0;
        color: #73778c;
        font-size: 13px;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .course-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 16px;
    }
    .course-price-area { display: flex; flex-direction: column; gap: 4px; }
    .course-price { color: #121a4d; font-size: 15px; font-weight: 700; overflow-wrap: anywhere; }
    .course-arrow {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        background: #121a4d;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
    }
    .courses-toolbar {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
        box-sizing: border-box;
    }
    .search-wrapper {
        width: 260px;
        height: 40px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
        box-sizing: border-box;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e5e3f2;
        border-radius: 10px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .search-wrapper:focus-within {
        border-color: #6547ff;
        box-shadow: 0 0 0 3px rgba(101, 71, 255, 0.1);
    }
    .search-icon { flex-shrink: 0; color: #85889a; font-size: 18px; line-height: 1; }
    .course-search {
        width: 100%;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        color: #121a4d;
        font-family: ${FONT_STACK};
        font-size: 12px;
    }
    .course-search::placeholder { color: #9a9cad; }
    .clear-search {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 50%;
        background: #eeedf5;
        color: #55586c;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.15s ease;
    }
    .clear-search:hover { background: #e2e0eb; }
    .search-empty-state {
        width: 100%;
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #73778c;
        font-size: 16px;
        text-align: center;
        box-sizing: border-box;
    }
    @media (max-width: 500px) {
        .courses-toolbar { justify-content: stretch; }
        .search-wrapper { width: 100%; }
        .searcg-empty-state {font-size: 14px;}
    }
`

// ── Currency ───────────────────────────────────────────────────────────
function formatPrice(course: Course, country: "IN" | "US") {
    if (country === "IN") {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(course.pricePaise / 100)
    }
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(course.priceUsdCents / 100)
}

// ── Contrast-safe text for an arbitrary designer-picked background ───────
// cardBackground comes from an open Color control. Framer's Color control
// hands back "#rrggbb" only until someone actually touches it in the
// panel — after that it returns "rgb(r, g, b)" or "rgba(r, g, b, a)".
// This parses either shape rather than assuming hex.
function parseColorToRgb(
    input: string
): { r: number; g: number; b: number } | null {
    const value = input.trim()

    const rgbMatch = value.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i
    )
    if (rgbMatch) {
        return {
            r: parseFloat(rgbMatch[1]),
            g: parseFloat(rgbMatch[2]),
            b: parseFloat(rgbMatch[3]),
        }
    }

    if (value.startsWith("#")) {
        let hex = value.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        }
        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)
            if (![r, g, b].some(Number.isNaN)) return { r, g, b }
        }
    }

    return null
}

function getReadableTextColors(background: string): {
    strong: string
    muted: string
} {
    const rgb = parseColorToRgb(background)
    if (!rgb) {
        return { strong: "#121a4d", muted: "#73778c" } // unparseable — assume a light card
    }

    const [rl, gl, bl] = [rgb.r, rgb.g, rgb.b]
        .map((c) => c / 255)
        .map((c) =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        )
    const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl

    return luminance > 0.5
        ? { strong: "#121a4d", muted: "#73778c" } // light background → dark text
        : { strong: "#f5f4fb", muted: "#b9bcd4" } // dark background → light text
}

function StatusPanel({
    title,
    description,
    role,
    ariaLive,
    action,
}: {
    title: string
    description: string
    role: "status" | "alert"
    ariaLive: "polite" | "assertive"
    action?: ReactNode
}) {
    return (
        <>
            <style>{STATUS_STYLES}</style>
            <div className="courses-status-wrapper">
                <section
                    className="courses-status-panel"
                    role={role}
                    aria-live={ariaLive}
                >
                    <p className="courses-status-eyebrow">Skillpath</p>
                    <h3 className="courses-status-title">{title}</h3>
                    <p className="courses-status-description">{description}</p>
                    {action}
                </section>
            </div>
        </>
    )
}

function CourseCard({
    course,
    country,
    cardRadius,
    cardBackground,
}: {
    course: Course
    country: "IN" | "US"
    cardRadius: number
    cardBackground: string
}) {
    const { strong, muted } = getReadableTextColors(cardBackground)
    // Keeps the arrow chip's roundness in proportion to the card's, so it
    // doesn't look like a leftover sharp corner on a very rounded card.
    const arrowRadius = Math.min(12, Math.max(6, cardRadius * 0.4))

    return (
        <div
            className="course-card"
            style={{ borderRadius: cardRadius, background: cardBackground }}
        >
            <div className="pill course-category">{course.mainCategory}</div>

            <h3 className="course-title" style={{ color: strong }}>
                {course.courseName}
            </h3>

            <p className="course-description" style={{ color: muted }}>
                {course.description}
            </p>

            <div className="course-footer">
                <div className="course-price-area">
                    <span className="course-price" style={{ color: strong }}>
                        {formatPrice(course, country)}
                    </span>
                    {course.refundable && (
                        <span className="pill refundable-badge">
                            Refundable
                        </span>
                    )}
                </div>
                <div
                    className="course-arrow"
                    style={{ borderRadius: arrowRadius }}
                >
                    →
                </div>
            </div>
        </div>
    )
}

export default function Courses({ cardRadius, cardBackground }: CoursesProps) {
    const [courses, setCourses] = useState<Course[]>([])
    const [country, setCountry] = useState<"IN" | "US" | null>(null)
    const [countryUnavailable, setCountryUnavailable] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchData = async () => {
        setLoading(true)
        setError(false)
        setCountryUnavailable(false)

        const [coursesResult, countryResult] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/assignment/course-data`).then((res) => {
                if (!res.ok)
                    throw new Error(`course-data returned ${res.status}`)
                return res.json()
            }),
            fetch(`${API_BASE_URL}/assignment/country-code`).then((res) => {
                if (!res.ok)
                    throw new Error(`country-code returned ${res.status}`)
                return res.json() as Promise<CountryResponse>
            }),
        ])

        if (
            coursesResult.status === "fulfilled" &&
            Array.isArray(coursesResult.value)
        ) {
            setCourses(coursesResult.value)
        } else {
            console.error(
                "Courses: failed to load course data —",
                coursesResult.status === "rejected"
                    ? coursesResult.reason
                    : "unexpected response shape"
            )
            setError(true)
        }

        if (countryResult.status === "fulfilled") {
            setCountry(countryResult.value.country_code)
        } else {
            console.error(
                "Courses: failed to load country code —",
                countryResult.reason
            )
            setCountryUnavailable(true)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const effectiveCountry: "IN" | "US" = country ?? "US"

    const filteredCourses = courses.filter((course) => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return true
        return (
            course.courseName.toLowerCase().includes(query) ||
            course.description.toLowerCase().includes(query) ||
            course.mainCategory.toLowerCase().includes(query) ||
            course.shortCourse.toLowerCase().includes(query)
        )
    })

    if (loading) {
        return (
            <StatusPanel
                role="status"
                ariaLive="polite"
                title="Loading courses"
                description="Please wait while we prepare your catalog."
            />
        )
    }

    if (error) {
        return (
            <StatusPanel
                role="alert"
                ariaLive="assertive"
                title="Courses unavailable"
                description="We couldn't load the courses."
                action={
                    <button
                        className="courses-status-retry"
                        onClick={fetchData}
                    >
                        Try Again
                    </button>
                }
            />
        )
    }

    if (courses.length === 0) {
        return (
            <StatusPanel
                role="status"
                ariaLive="polite"
                title="No courses yet"
                description="New learning paths will appear here soon."
            />
        )
    }

    return (
        <>
            <style>{GRID_STYLES}</style>
            <div className="courses-root">
                {countryUnavailable && (
                    <p className="courses-notice">
                        Couldn't detect your region, so prices are shown in USD.
                    </p>
                )}

                <div className="courses-toolbar">
                    <div className="search-wrapper">
                        <span className="search-icon">⌕</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Search courses..."
                            className="course-search"
                            aria-label="Search courses"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() => setSearchQuery("")}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {filteredCourses.length === 0 && searchQuery.trim() ? (
                    <div className="search-empty-state">
                        No courses match your search.
                    </div>
                ) : (
                    <div className="courses-grid">
                        {filteredCourses.map((course) => (
                            <CourseCard
                                key={course.courseCode}
                                course={course}
                                country={effectiveCountry}
                                cardRadius={cardRadius}
                                cardBackground={cardBackground}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

addPropertyControls(Courses, {
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
})
