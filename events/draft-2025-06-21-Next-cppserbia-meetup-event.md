---
title: "Next C++ Serbia Meetup Event"
date: 2025-06-21T18:00:00+02:00
created: 2025-05-14T19:48:33-04:00
event_type: PHYSICAL
status: DRAFT
duration: PT2H
end_time: 2025-06-21T20:00:00+02:00
event_url: https://www.meetup.com/cpp-serbia/events/307829937/
event_id: 307829937
venues: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
---

# Next C++ Event

Did you ever go to a technical interview where you had to do live coding sessions with all the algorithms that you have (or have not) learned in an `some inline code` Algorithms course, just so that you never use them on the job?

```cpp
template<class ForwardIt, class T = typename std::iterator_traits<ForwardIt>::value_type,
         class Compare>
ForwardIt lower_bound(ForwardIt first, ForwardIt last, const T& value, Compare comp)
{
    ForwardIt it;
    typename std::iterator_traits<ForwardIt>::difference_type count, step;
    count = std::distance(first, last);

    while (count > 0)
    {
        it = first;
        step = count / 2;
        std::advance(it, step);

        if (comp(*it, value))
        {
            first = ++it;
            count -= step + 1;
        }
        else
            count = step;
    }

    return first;
}
```



## 📅 Event Details

| | |
|---|---|
| 👤 **Speaker** | **[Aleksandar Nikolić](https://www.linkedin.com/in/aleksandar-nikoli%C4%87-61b38779/)** |
| 🕕 **Date & Time** | **21st of May (Wednesday), 6 pm** |
| 📍 **Location** | **Beograđanka, Vidikovac, 22nd floor** |
| 🏢 **Address** | **Masarikova 5** |
| 💻 **Online** | **[C++ Serbia Twitch](https://www.twitch.tv/cppserbia)** |

See you!
