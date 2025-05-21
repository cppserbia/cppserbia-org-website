export default function EventFallbackNotice() {
  return (
    <div className="p-4 border border-yellow-600/30 rounded-lg bg-yellow-950/20 text-yellow-300 mb-6">
      <h3 className="font-medium mb-2">Note:</h3>
      <p>
        We're currently experiencing issues connecting to the Meetup.com API. Please
        check our{" "}
        <a
          href="https://www.meetup.com/cpp-serbia/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-yellow-200"
        >
          Meetup page
        </a>{" "}
        for the most up-to-date information.
      </p>
    </div>
  )
}
