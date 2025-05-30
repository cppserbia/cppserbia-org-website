---
title: "Making your program faster - multithreading and automatic compiler vectorization"
date: 2025-04-23T18:00:00+02:00
created: 2025-04-22T10:00:19-04:00
event_type: PHYSICAL
status: PAST
duration: PT2H
end_time: 2025-04-23T20:00:00+02:00
event_url: https://www.meetup.com/cpp-serbia/events/307420012/
event_id: 307420012
venues: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
featured: true
---

# Making your program faster - multithreading and automatic compiler vectorization

The idea of this session is to teach you in 90 minutes how to make your program faster, through multithreading and compiler autovectorization.
In the first part, we introduce the basics of multithreaded programming in C++ with OpenMP. OpenMP is a multithreaded programming standard that exists for many years and supported by all compilers - this is your opportunity to quickly learn its basics.
But multithreading is not worth much if the program is not efficient to begin with. Therefore, we investigate the performance of single threaded programs with particular focus on compiler's autovectorization.
In the second part, we explain what are vector instructions, and explain the process of autovectorization, when the compiler emits vector instructions to make your loop faster.
The main focus of this part are vectorization inhibitors: parts of your C++ code that prevent automatic compiler vectorization. We give examples of unvectorized loops, we examine CLANG's vectorization report and we give solutions that will make codes several times faster with minimal modification.


## 📅 Event Details

| | |
|---|---|
| 👤 **Speaker** | **[Ivica Bogosavljević](https://johnnysswlab.com/)** |
| 🕕 **Date & Time** | **23rd of April (Wednesday), 6 pm** |
| 📍 **Location** | **Beograđanka, Vidikovac, 22nd floor** |
| 🏢 **Address** | **Masarikova 5** |

See you!
