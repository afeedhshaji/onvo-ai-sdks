import { Textarea } from "../../tremor/Textarea";
import { Label, Metric, Text } from "../../tremor/Text";
import { Icon } from "../../tremor/Icon";
import { Card } from "../../tremor/Card";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "sonner";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { create } from "zustand";
import QuestionMessage from "./QuestionMessage";
import QuestionSidebar from "./QuestionSidebar";
import React from "react";
import SuggestionsBar from "./SuggestionsBar";
import { useBackend } from "../Wrapper";
import { useDashboard } from "../Dashboard";
import Logo from "./Logo";
import QuestionLoader from "./QuestionLoader";
import { Question } from "@onvo-ai/js";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../../tremor/Dialog";

dayjs.extend(relativeTime);

export const useQuestionModal = create<{
  open: boolean;
  setOpen: (o: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (o: boolean) => set({ open: o }),
}));

export const QuestionModal: React.FC<{}> = ({}) => {
  const backend = useBackend();
  const { dashboard, container, adminMode } = useDashboard();

  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useQuestionModal((state) => [
    state.open,
    state.setOpen,
  ]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question>();
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const getQuestions = async () => {
    setLoading(true);
    if (!backend || !dashboard) return;
    let qs: any[] = await backend.questions.list({ dashboard: dashboard.id });
    setLoading(false);
    let sorted = qs.sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    setQuestions(sorted);
    if (questionLoading) {
      if (sorted.length > 0) {
        setSelectedQuestion(sorted[0]);
      }
      setQuestionLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (open && dashboard && dashboard.id) {
      getQuestions();
      backend
        ?.dashboard(dashboard.id)
        .getWidgetSuggestions()
        .then((newSuggestions: string[]) => {
          if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions);
          }
        });
    } else {
      setSuggestions([]);
    }
  }, [open, dashboard]);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setSelectedQuestion(undefined);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  useEffect(() => {
    if (selectedQuestion) {
      // @ts-ignore
      let questionMessages = selectedQuestion.messages as any[];
      setMessages(questionMessages);
      setTimeout(scrollToBottom, 100);
    } else {
      setMessages([]);
    }
  }, [selectedQuestion]);

  const askQuestion = async (
    msg: { role: "user" | "assistant"; content: string }[]
  ) => {
    setMessages(msg);
    setQuestionLoading(true);
    window.setTimeout(scrollToBottom, 300);
    if (!dashboard) {
      toast.error("Failed to find associated dashboard.");
      return;
    }
    try {
      let response = await backend?.questions.create({
        dashboardId: dashboard?.id,
        questionId: selectedQuestion?.id || undefined,
        messages: msg,
      });
      setSelectedQuestion(response);
    } catch (e: any) {
      toast.error("Failed to ask question: ", e.message);
      setMessages((m) => {
        return [
          ...m,
          {
            role: "assistant",
            content:
              "I could not answer your question. Could you try adding some more details about the question?",
          },
        ];
      });
    }

    setQuestionLoading(false);
  };

  const questionMessageList = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    return messages.map((a, index) => (
      <QuestionMessage
        index={index}
        dashboardId={dashboard?.id}
        teamId={dashboard?.team || selectedQuestion?.team || undefined}
        questionId={selectedQuestion?.id || "null"}
        onDelete={() => {
          let newMessages = messages.filter((m, i) => i < index);
          backend?.questions.update(selectedQuestion?.id || "null", {
            messages: newMessages,
          });
          setMessages(newMessages);
        }}
        onReply={(msg) => {
          let newMessages = [
            ...messages,
            {
              role: "user" as const,
              content: msg,
            },
          ];
          askQuestion(newMessages);
        }}
        onEdit={(msg) => {
          let newMessages = messages
            .map((m, i) => {
              if (i === index) {
                return {
                  ...m,
                  content: msg,
                };
              }
              return m;
            })
            .filter((m, i) => i <= index);
          askQuestion(newMessages);
        }}
        key={
          (selectedQuestion?.id || "null") +
          "-" +
          messages.length +
          "-" +
          index +
          "-" +
          (a.content || "").substring(0, 10)
        }
        onClose={() => {
          setSelectedQuestion(undefined);
          setMessages([]);
          setOpen(false);
        }}
        messages={messages}
        role={a.role}
        content={a.content}
      />
    ));
  }, [messages, dashboard, selectedQuestion]);

  if (!dashboard?.settings?.can_ask_questions && !adminMode) return <></>;

  return (
    <>
      <div
        className={
          "relative right-0 z-10 w-full p-3 border-t border-gray-200 dark:border-gray-800"
        }
      >
        <div className="absolute top-0 left-0 w-full h-full foreground-color opacity-30 dark:opacity-50" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="rounded-lg cursor-text shadow-lg h-9 z-10 px-2 relative mx-auto flex w-full flex-grow flex-shrink-0 max-w-2xl flex-row items-center gap-2">
              <div className="gradient-border foreground-color" />
              <SparklesIcon className="h-5 w-5 text-blue-500 z-10" />
              <Text className="z-10 flex-grow">
                Describe the chart you want to make...
              </Text>
              <Icon
                className="z-10"
                icon={ArrowUpIcon}
                size="xs"
                variant="solid"
              />
            </div>
          </DialogTrigger>
          <DialogContent
            container={container}
            className="max-w-none w-full h-full rounded-none p-0 border-0"
          >
            <div className="onvo-question-modal-question-list flex flex-col foreground-color absolute w-full right-0 top-0 z-20 h-full">
              <div
                className={
                  "foreground-color top-0 w-full z-10 flex flex-row items-center gap-4 border-b border-gray-200 px-3 py-2 dark:border-gray-800"
                }
              >
                <DialogClose asChild>
                  <Icon icon={ChevronLeftIcon} variant="shadow" />
                </DialogClose>
                <div className="flex flex-row w-full gap-1 flex-grow justify-start items-center">
                  <Text>{dashboard?.title}</Text>
                  <ChevronRightIcon className="h-4 w-4" />
                  <Label>Create a chart</Label>
                </div>
                <div className="w-[170px] h-4" />
              </div>
              <div className="flex flex-grow w-full h-[calc(100%-52px)] flex-row">
                <QuestionSidebar
                  loading={loading}
                  questions={questions}
                  selectedQuestionId={selectedQuestion?.id || undefined}
                  onSelect={(q) => {
                    setSelectedQuestion(q);
                    setMessages([]);
                    setQuery("");
                  }}
                  onDelete={() => {
                    setSelectedQuestion(undefined);
                    getQuestions();
                  }}
                />
                <div className="flex h-full w-full flex-col justify-between">
                  <div
                    className="flex w-full flex-grow flex-col gap-4 overflow-y-auto px-2 py-4"
                    ref={scroller}
                  >
                    <div className="mx-auto w-full max-w-2xl">
                      {messages.length === 0 && !questionLoading && (
                        <>
                          <div className="flex w-full pt-8 pb-12 flex-col items-center justify-center">
                            <Icon
                              size="xl"
                              variant="shadow"
                              icon={() => <Logo height={72} width={72} />}
                            />
                            <Metric className="mt-2">
                              Ask me for a widget or visualisation
                            </Metric>
                          </div>
                          <div className="onvo-question-modal-suggestions-list grid grid-cols-2 gap-2">
                            {suggestions.length > 0
                              ? suggestions.map((a) => (
                                  <Card
                                    key={a}
                                    className="foreground-color cursor-pointer p-3"
                                    onClick={() => {
                                      let newMessages = [
                                        ...messages,
                                        {
                                          role: "user" as const,
                                          content: a,
                                        },
                                      ];

                                      askQuestion(newMessages);
                                    }}
                                  >
                                    <Text>{a}</Text>
                                  </Card>
                                ))
                              : [1, 2, 3, 4].map((a) => (
                                  <Card
                                    className="foreground-color animate-pulse"
                                    key={"skeleton-" + a}
                                  >
                                    <div className="mb-2 h-2 w-10/12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="h-2 w-7/12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                  </Card>
                                ))}
                          </div>
                        </>
                      )}

                      {questionMessageList}

                      {questionLoading && <QuestionLoader />}
                    </div>
                  </div>

                  <div className="relative mx-auto mb-2 mt-4 w-full max-w-2xl px-2">
                    {messages.length > 0 && (
                      <SuggestionsBar onSelect={(val) => setQuery(val)} />
                    )}
                    <div className="relative flex w-full flex-col items-center justify-center gap-2">
                      <Textarea
                        className="background-color min-h-[58px] pr-[52px]"
                        ref={input}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Describe the chart or visualization you want to make...`}
                        autoFocus
                        onKeyUp={(evt) => {
                          if (evt.key === "Enter" && !evt.shiftKey) {
                            let newMessages = [
                              ...messages,
                              {
                                role: "user" as const,
                                content: query,
                              },
                            ];
                            askQuestion(newMessages);
                            setQuery("");
                          }
                        }}
                      />
                      <Icon
                        className="absolute right-3 top-3 z-10"
                        variant="solid"
                        icon={ArrowUpIcon}
                        onClick={() => {
                          let newMessages = [
                            ...messages,
                            {
                              role: "user" as const,
                              content: query,
                            },
                          ];
                          askQuestion(newMessages);
                          setQuery("");
                        }}
                      />
                      <Text className="mt-0 text-center text-xs">
                        Not sure how to write a prompt?{" "}
                        <a
                          href="https://onvo.ai/blog/writing-better-ai-prompts-for-dashboard-generation/"
                          target="_blank"
                          className="text-blue-500"
                        >
                          Check out this article
                        </a>
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
