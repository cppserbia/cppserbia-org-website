---
title: "Saving and Restoring Processes with CRIU: The Challenge of Shadow Stacks on ARM64"
date: 2025-11-19T18:00:00
created: 2025-11-05T15:48:33-04:00
event_type: PHYSICAL
status: ACTIVE
duration: PT2H
end_time: 2025-11-19T20:00:00
event_url: https://www.meetup.com/cpp-serbia/events/311869777/
event_id: 311510821
venues: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
---

# Saving and Restoring Processes with CRIU: The Challenge of Shadow Stacks on ARM64

This talk introduces CRIU, the tool behind process checkpoint/restore and container live migration, and explores what happens when future CPU features meet current software.

Igor shares his work extending CRIU to support the upcoming Arm64 Guarded Control Stack (GCS), explaining why it breaks existing restore logic, how he made it work, and what he learned by digging into process state, signal frames, and other OS mechanisms CRIU leverages.

# About Speaker

Igor Svilenkov Božić is a software engineer with experience across infrastructure, automation, and software development.
He's always been fascinated by operating system internals, especially the Linux kernel, and enjoys exploring rabbit holes of operating systems and their underlying hardware implementations.

## 📅 Event Details

| | |
|---|---|
| 👤 **Speaker** | **[Igor Svilenkov Božić](https://www.linkedin.com/in/svilenkov/)** |
| 🕕 **Date & Time** | **19th of November (Wednesday), 6 pm** |
| 📍 **Location** | **Beograđanka, Vidikovac, 22nd floor** |
| 🏢 **Address** | **Masarikova 5** |
| 💻 **Online** | **[C++ Serbia Twitch](https://www.twitch.tv/cppserbia)** |

See you!
