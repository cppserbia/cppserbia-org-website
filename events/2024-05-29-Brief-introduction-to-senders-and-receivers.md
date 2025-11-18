---
title: "Brief introduction to senders and receivers (P2300)"
date: 2024-05-29T18:00:00
created: 2024-05-24T04:35:34-04:00
event_type: PHYSICAL
status: PAST
duration: PT5H30M
end_time: 2024-05-29T23:30:00
event_url: https://www.meetup.com/cpp-serbia/events/301214926/
event_id: 301214926
venues: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
youtube: https://www.youtube.com/watch?v=R-IxA5V9UC4
---

# Brief introduction to senders and receivers (P2300)

Asynchronous programming in C++ is not an easy task. There are various async models and corresponding libraries that facilitate these tasks, and it seems that it's becoming easier. With C++20 coroutines, we got new possibilities, but standard library support for coroutines is virtually nonexistent. Also, having only C++ coroutines in a toolbox is like having only raw pointers or std::thread, i.e., low-level primitives, which cannot be enough for highly composable and scalable APIs. There are a lot of libraries for async tasks implemented on top of coroutines, but there's still an open question - which one to use?

Aside from coroutines, Senders/Receivers emerged as a quite promising model for async computations and hopefully, we'll get std::execution (P2300) in C++26.

In this talk, I'll present Sender/Receiver concepts, various examples from stdexec, NVIDIA's implementation of std::execution proposal and I'll shed some light on how Sender/Receiver model interacts with C++ coroutines.

## 📅 Event Details

| | |
|---|---|
| 👤 **Speaker** | [Goran Aranđelović](https://www.linkedin.com/in/goranarandjelovic/) |
| 🕕 **Date & Time** | **29th of May (Wednesday), 6pm** |
| 📍 **Location** | **Beograđanka, Vidikovac, 22nd floor** |
| 🏢 **Address** | **Masarikova 5** |
| 💻 **Online** | [https://cppserbia.com/meet](https://cppserbia.com/meet) |

See you!
