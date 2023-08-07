import { useContext } from "react";
import { CurrentScheduleContext } from "./ScheduleDisplay";

const getRatingColor = (rating) => {
  if(rating === "N/A") return "text-indigo-500 group-active:text-indigo-600 "
  if(rating >= 4) return "text-green-500 group-active:text-green-600 "
  if(rating >= 3) return "text-amber-500 group-active:text-amber-600"
  return "text-red-500"
}

const getEarliestAndLatestTime = (schedule) => {
  const scheduleTimes = schedule.reduce((acc, node) => {
  const nodeStartTime = new Date(node.startTime)
  const nodeEndTime = new Date(node.endTime)
  return {
    earliestTime: nodeStartTime< acc.earliestTime ? nodeStartTime : acc.earliestTime,
    latestTime: nodeEndTime > acc.latestTime ? nodeEndTime : acc.latestTime
  }
  }, {earliestTime: new Date(Date.UTC(1970, 0, 1, 23, 59, 0)),  latestTime: new Date(Date.UTC(1970, 0, 1, 0, 0, 0))})

  scheduleTimes.earliestTime = `${String(scheduleTimes.earliestTime.getUTCHours()).padStart(2, "0")}:${String(scheduleTimes.earliestTime.getUTCMinutes()).padStart(2, "0")}`
  scheduleTimes.latestTime = `${String(scheduleTimes.latestTime.getUTCHours()).padStart(2, "0")}:${String(scheduleTimes.latestTime.getUTCMinutes()).padStart(2, "0")}`
  return scheduleTimes
}

const getClassDays = (schedule) => {
  const datsSet = schedule.reduce((acc, node) => {
    node.days.forEach(day => acc.add(day))
    return acc
  }, new Set())
  let dayString = ""
  if(datsSet.has("Mon")) dayString += "M "
  if(datsSet.has("Tue")) dayString += "Tu "
  if(datsSet.has("Wed")) dayString += "W "
  if(datsSet.has("Thu")) dayString += "Th "
  if(datsSet.has("Fri")) dayString += "F "
  return dayString
}

export default function ScheduleCard({scheduleFlow, index}) {
  const currRating = scheduleFlow.scheduleRating
  const {earliestTime, latestTime} = getEarliestAndLatestTime(scheduleFlow.schedule)
  const {currScheduleId, setCurrScheduleId} = useContext(CurrentScheduleContext)
  const focusClass = index - 1 === currScheduleId ? " bg-indigo-200" : ""
  return (
    <div className={"card group rounded-md bg-indigo-100 h-[7rem] w-full my-1 p-2 shadow-md flex flex-row gap-x-2 active:bg-indigo-200 cursor-pointer" + focusClass}
    onClick={() => setCurrScheduleId(index - 1)}>
      <div className="flex flex-col h-full justify-center">
        <div
          className={"radial-progress text-xl font-extrabold shadow-md " + getRatingColor(currRating)}
          style={{ "--value": `${currRating === "N/A" ? 0 : currRating/5 * 100}`, "--size": "5.5rem", "--thickness": "0.35rem" }}>
          {currRating === "N/A" ? "N/A" : `${currRating}/5`}
        </div>
      </div>
      <div className="flex flex-col w-full h-full justify-center">
      <h1 className="font-bold text-neutral-600 text-xl group-active:text-neutral-800">Schedule #{index}</h1>
      <div className=" flex flex-row">
        <div className="flex flex-col text-black">
          <p className="inline">Class Days: &nbsp;</p>
          <p className="inline">Earliest Start Time: &nbsp;</p>
          <p className="inline">Latest End Time: &nbsp;</p>
        </div>
        <div className="flex flex-col text-black text-md">
          <p>{getClassDays(scheduleFlow.schedule)}</p>
          <p>{earliestTime}</p>
          <p>{latestTime}</p>
        </div>
      </div>
      </div>
    </div>
  );
}
