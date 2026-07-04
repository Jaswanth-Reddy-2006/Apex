import type * as backendChat from "../../../backend/src/services/chat.functions";
import { createClientFn } from "./api-client";

export const listConversations = createClientFn("listConversations", "GET") as typeof backendChat.listConversations;
export const createConversation = createClientFn("createConversation", "POST") as typeof backendChat.createConversation;
export const getConversationMessages = createClientFn("getConversationMessages", "GET") as typeof backendChat.getConversationMessages;
export const renameConversation = createClientFn("renameConversation", "POST") as typeof backendChat.renameConversation;
export const togglePinConversation = createClientFn("togglePinConversation", "POST") as typeof backendChat.togglePinConversation;
export const deleteConversation = createClientFn("deleteConversation", "POST") as typeof backendChat.deleteConversation;
export const searchConversations = createClientFn("searchConversations", "POST") as typeof backendChat.searchConversations;
export const uploadChatFileSignedUrl = createClientFn("uploadChatFileSignedUrl", "POST") as typeof backendChat.uploadChatFileSignedUrl;
export const getMyContext = createClientFn("getMyContext", "GET") as typeof backendChat.getMyContext;
