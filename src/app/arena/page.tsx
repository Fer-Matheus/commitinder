"use client";
import OkayHand from "@/assets/ok";
import AnimatedButton from "@/components/animatedButton";
import { MoreInfo } from "@/components/choice";
import CommitMessage from "@/components/commitMessage";
import DiffContainer from "@/components/diffContainer";
import { DiffViewer } from "@/components/diffViewer";
import NavBar from "@/components/navbar";
import { ShowOptions } from "@/components/options";
import { Base } from "@/components/page/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProgressBar from "@/components/ui/progress";
import { aspects, Aspects } from "@/models/aspect";
import { Options } from "@/models/result";
import { GetDuel, SendResults } from "@/services/duel";
import { deleteCookie } from "cookies-next";
import { ParsedDiff, parsePatch } from "diff";
import { CircleCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEventHandler, useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();

  const [duel_id, setDuelId] = useState(0);
  const [messageA, setMessageA] = useState("");
  const [messageB, setMessageB] = useState("");
  const [index, setIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [options, setOptions] = useState<Options[]>([]);
  const [currentAspect, setCurrentAspect] = useState<Aspects>(aspects[index]);
  const [diffs, setDiffs] = useState<ParsedDiff[]>([]);
  const [currentDiff, setCurrentDiff] = useState<ParsedDiff>(diffs[0]);

  const handleSendClick = async () => {
    const _ = await SendResults({ duel_id, options });
  };

  useEffect(() => {
    const getOneDuel = async () => {
      const response = await GetDuel();

      const duelReceived = response.data;

      if (response.status === 204) {
        router.push("/finished");
      } else {
        const incommingDiffs = parsePatch(duelReceived.diff_content);

        setDuelId(duelReceived.duel_id);
        setDiffs(incommingDiffs);
        setMessageA(duelReceived.commit_message_a);
        setMessageB(duelReceived.commit_message_b);
        setCurrentDiff(incommingDiffs[0]);
      }
    };
    getOneDuel();
  }, []);

  const handlerClick = (option: string, initialTimer: number) => {
    if (options.length < 5) {
      const endTimer = new Date().getTime();
      const totalTimer = (endTimer - initialTimer) / 1000;
      const currentOption: Options = {
        aspect: currentAspect.title,
        choice_time: totalTimer,
        chosen_option: option,
      };

      options.push(currentOption);
      setOptions(options);
    }

    const newIndex = index + 1;
    if (index < 4) {
      setIndex(newIndex);
      setCurrentAspect(aspects[newIndex]);
    } else {
      setIsModalOpen(true);
    }
  };

  type SimpleButtonProps = {
    message: string;
    handle: MouseEventHandler;
  };
  function SimpleButton({ message, handle }: SimpleButtonProps) {
    return (
      <a
        href=""
        className="bg-[#3A506B] w-[10rem] h-[2.5rem] rounded-xl flex justify-center items-center text-textColor"
        onClick={handle}
      >
        {message}
      </a>
    );
  }

  function createCarouselItem() {
    const initialTimer = new Date().getTime();

    return (
      <div className="w-full flex flex-col items-center">
        <div className="mt-5 w-[40rem] h-[5rem] flex items-center justify-center">
          <div className="w-1/2 h-[5rem] flex items-center justify-start">
            <p className="text-auto text-textColor">
              Which of the two proposed messages, in your opinion, is better in
              each aspect:
            </p>
          </div>
          <div className="w-1/2 h-[5rem] flex">
            <div className="w-[70%] m-3 ml-[1rem] rounded-md flex items-center justify-center text-white text-xl border-2 border-borderItems bg-[#3A506B]">
              {currentAspect.title}
            </div>
            <MoreInfo description={currentAspect.description} />
          </div>
        </div>
        <div className="w-full flex items-center justify-center">
          <div className="mt-5 w-[40rem] h-[5rem] flex justify-between">
            <div className="ml-[4rem]">
              <div className="w-[15em] h-[3rem] flex text-textColor text-xl">
                <AnimatedButton
                  option="A"
                  handlerClick={handlerClick}
                  initialTimer={initialTimer}
                />
              </div>
            </div>
            <div className="-ml-[55px] ">
              <AnimatedButton
                option="B"
                handlerClick={handlerClick}
                initialTimer={initialTimer}
              />
            </div>
          </div>
        </div>
        <Dialog open={isModalOpen}>
          <DialogContent className="bg-itemsBackgroud border-2 border-borderItems text-md text-textColor">
            <DialogHeader>
              <DialogTitle className="text-3xl">Confirm:</DialogTitle>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <ShowOptions options={options} />
            <div className="mt-5 flex justify-around text-2xl">
              <SimpleButton message="Confirm" handle={handleSendClick} />
              <SimpleButton message="Cancel" handle={() => {}} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  function Logout() {
    deleteCookie("Authorization");
    router.push("/");
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    setCurrentDiff(diffs[Number.parseInt(e.target.value)]);
  };

  function showOptions(diff: ParsedDiff, index: number) {
    const file = diff.newFileName ?? diff.oldFileName;
    const fileName = file?.split("/")[file.split("/").length - 1];
    return (
      <option key={index} value={index}>
        {fileName}
      </option>
    );
  }

  return (
    <div>
      <Base>
        <NavBar />
        <div className="mt-2">
          <div className="flex">
            <div className="w-1/2">
              <p className="w-1/2 text-xl">Number of files changed: {diffs.length}</p>
              <label htmlFor="currentDiff" className="text-xl mr-5">
                Choose a file
              </label>
              <select
                name="currentDiff"
                id="currentDiff"
                onChange={handleChange}
                className="bg-itemsBackgroud text-xl border border-borderItems rounded-xl w-1/2"
              >
                {diffs.map((diff, index) => showOptions(diff, index))}
              </select>
            </div>
            <div className="w-1/2 flex flex-col justify-between ml-5">
              <h1 className="text-xl mr-5">Progress:</h1>
              <ProgressBar total={120} current={duel_id - 1} />
            </div>
          </div>
          <DiffContainer>
            <DiffViewer currentDiff={currentDiff} />
          </DiffContainer>
        </div>
        <div className="mt-2 w-[80rem] h-[12rem] flex items-center">
          <CommitMessage title={"Message A"} message={messageA} />
          <CommitMessage title={"Message B"} message={messageB} />
        </div>
        <div className="mt-2 w-[80rem] h-[12rem] flex items-center">
          {createCarouselItem()}
        </div>
        <footer className="mt-6 w-[20rem] h-[2rem] text-textColor flex items-end justify-around">
          <a target="_blank" href="https://gesaduece.com.br/">GESAD</a>

          <button
            onClick={Logout}
            className="flex flex-col justify-center items-center"
          >
            <LogOut size={30} />
            <p>Logout</p>
          </button>
        </footer>
      </Base>
    </div>
  );
}
