---
title: TEMPLATE EVENT
date: 2225-06-21T18:00:00
created:
event_type: PHYSICAL
status: DRAFT # Change to UPCOMING
duration:
end_time:
event_url: <Meetup.com Event URL>
event_id: <Meetup.com Event ID>
venues: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
# youtube:   # Add after event
---

# TEMPLATE EVENT

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

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
| 👤 **Speaker** | [Speaker Name](https://www.linkedin.com/in/speaker-linkedin) |
| 🕕 **Date & Time** |  |
| 📍 **Location** | **Beograđanka, Vidikovac, 22nd floor** |
| 🏢 **Address** | **Masarikova 5** |
| 💻 **Online** | [https://twitch.tv/cppserbia](https://twitch.tv/cppserbia) |

Vidimo se!
