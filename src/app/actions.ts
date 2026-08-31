'use server';

// ============================================================================
// FSM TİYATRO — MODÜLER SERVER ACTIONS BARİYERİ
// Next.js Turbopack uyumlu RPC wrapper fonksiyonları
// ============================================================================

import * as authActions from '@/lib/actions/auth.actions';
import * as contentActions from '@/lib/actions/content.actions';
import * as rehearsalActions from '@/lib/actions/rehearsal.actions';
import * as eventActions from '@/lib/actions/event.actions';
import * as attendanceActions from '@/lib/actions/attendance.actions';
import * as notificationActions from '@/lib/actions/notification.actions';
import * as ticketActions from '@/lib/actions/ticket.actions';
import * as adminActions from '@/lib/actions/admin.actions';

// 1. Auth & Kullanıcı Eylemleri
export async function registerUser(formData: FormData) {
  return authActions.registerUser(formData);
}

export async function approveUser(formData: FormData) {
  return authActions.approveUser(formData);
}

export async function updateUserMembershipStatus(formData: FormData) {
  return authActions.updateUserMembershipStatus(formData);
}

export async function rejectUser(formData: FormData) {
  return authActions.rejectUser(formData);
}

export async function changePassword(formData: FormData) {
  return authActions.changePassword(formData);
}

export async function updateProfile(formData: FormData) {
  return authActions.updateProfile(formData);
}

export async function changeUserRole(formData: FormData) {
  return authActions.changeUserRole(formData);
}

export async function uploadAvatar(formData: FormData) {
  return authActions.uploadAvatar(formData);
}

export async function deleteUserRecord(formData: FormData) {
  return authActions.deleteUserRecord(formData);
}

export async function requestPasswordReset(formData: FormData) {
  return authActions.requestPasswordReset(formData);
}

export async function completePasswordReset(formData: FormData) {
  return authActions.completePasswordReset(formData);
}

export async function migrateAlumniEmail(formData: FormData) {
  return authActions.migrateAlumniEmail(formData);
}

export async function adminUpdateUserEmail(formData: FormData) {
  return authActions.adminUpdateUserEmail(formData);
}

// 2. İçerik, Oyun, Blog & Akademik Eylemler
export async function addPost(formData: FormData) {
  return contentActions.addPost(formData);
}

export async function updatePost(formData: FormData) {
  return contentActions.updatePost(formData);
}

export async function approvePost(formData: FormData) {
  return contentActions.approvePost(formData);
}

export async function rejectPost(formData: FormData) {
  return contentActions.rejectPost(formData);
}

export async function deletePost(formData: FormData) {
  return contentActions.deletePost(formData);
}

export async function addPlay(formData: FormData) {
  return contentActions.addPlay(formData);
}

export async function updatePlay(formData: FormData) {
  return contentActions.updatePlay(formData);
}

export async function getAIAnalysis(title: string, content: string, category: string) {
  return contentActions.getAIAnalysis(title, content, category);
}

export async function deletePlay(formData: FormData) {
  return contentActions.deletePlay(formData);
}

export async function updatePlayStatus(formData: FormData) {
  return contentActions.updatePlayStatus(formData);
}

export async function toggleLike(postId: string) {
  return contentActions.toggleLike(postId);
}

export async function addComment(formData: FormData) {
  return contentActions.addComment(formData);
}

export async function uploadScript(formData: FormData) {
  return contentActions.uploadScript(formData);
}

export async function deleteScript(formData: FormData) {
  return contentActions.deleteScript(formData);
}

// 3. Prova, Yoklama, Etkinlik & Bildirim Eylemleri
export async function addRehearsal(formData: FormData) {
  return rehearsalActions.addRehearsal(formData);
}

export async function deleteRehearsal(formData: FormData) {
  return rehearsalActions.deleteRehearsal(formData);
}

export async function addEvent(formData: FormData) {
  return rehearsalActions.addEvent(formData);
}

export async function updateEvent(formData: FormData) {
  return rehearsalActions.updateEvent(formData);
}

export async function deleteEvent(formData: FormData) {
  return rehearsalActions.deleteEvent(formData);
}

export async function joinEvent(formData: FormData) {
  return rehearsalActions.joinEvent(formData);
}

export async function reserveEventTicket(eventId: string) {
  return rehearsalActions.reserveEventTicket(eventId);
}

export async function cancelEventTicketReservation(reservationId: string) {
  return rehearsalActions.cancelEventTicketReservation(reservationId);
}

export async function getEventReservations(eventId: string) {
  return rehearsalActions.getEventReservations(eventId);
}

export async function saveFCMToken(token: string) {
  return rehearsalActions.saveFCMToken(token);
}

export async function nudgePlayers(targetUserIds?: string[]) {
  return rehearsalActions.nudgePlayers(targetUserIds);
}

export async function testPushToSelf() {
  return rehearsalActions.testPushToSelf();
}

// 4. Bilet, Gişe & QR Doğrulama Eylemleri
export async function addTicket(formData: FormData) {
  return ticketActions.addTicket(formData);
}

export async function updateTicketReference(formData: FormData) {
  return ticketActions.updateTicketReference(formData);
}

export async function findTicket(formData: FormData) {
  return ticketActions.findTicket(formData);
}

export async function verifyTicket(ticketId: string) {
  return ticketActions.verifyTicket(ticketId);
}

export async function deleteTicket(formData: FormData) {
  return ticketActions.deleteTicket(formData);
}

export async function getOccupiedSeats() {
  return ticketActions.getOccupiedSeats();
}

// 5. Yönetim & Site Yapılandırma Eylemleri
export async function addTeamNeed(formData: FormData) {
  return adminActions.addTeamNeed(formData);
}

export async function updateTeamNeed(formData: FormData) {
  return adminActions.updateTeamNeed(formData);
}

export async function deleteTeamNeed(formData: FormData) {
  return adminActions.deleteTeamNeed(formData);
}

export async function applyForTeamNeed(formData: FormData) {
  return adminActions.applyForTeamNeed(formData);
}

export async function deleteTeamApplication(formData: FormData) {
  return adminActions.deleteTeamApplication(formData);
}

export async function updateUserPlays(userId: string, playIds: string[]) {
  return adminActions.updateUserPlays(userId, playIds);
}

export async function getSiteConfig() {
  return adminActions.getSiteConfig();
}

export async function updateSiteConfig(formData: FormData) {
  return adminActions.updateSiteConfig(formData);
}

export async function updateUserTitles(userId: string, titles: string[]) {
  return adminActions.updateUserTitles(userId, titles);
}

export async function addAvailableTitle(formData: FormData) {
  return adminActions.addAvailableTitle(formData);
}

export async function removeAvailableTitle(title: string) {
  return adminActions.removeAvailableTitle(title);
}

export async function getAvailableTitles() {
  return adminActions.getAvailableTitles();
}

// 5. Birleşik Etkinlik, Prova & Takvim Eylemleri (Faz 1.6A)
export async function createEvent(formData: FormData) {
  return eventActions.createEvent(formData);
}

export async function deleteUnifiedEvent(formData: FormData) {
  return eventActions.deleteUnifiedEvent(formData);
}

export async function getUserRelatedEvents(userId: string, userEmail: string) {
  return eventActions.getUserRelatedEvents(userId, userEmail);
}

export async function migrateLegacyRehearsalsToEvents() {
  return eventActions.migrateLegacyRehearsalsToEvents();
}

// 6. QR Doğrulamalı Yoklama & Dürtme Eylemleri (Faz 1.6A)
export async function openAttendanceSession(eventId: string, durationMinutes?: number) {
  return attendanceActions.openAttendanceSession(eventId, durationMinutes);
}

export async function closeAttendanceSession(sessionId: string) {
  return attendanceActions.closeAttendanceSession(sessionId);
}

export async function verifyAttendanceViaQR(token: string) {
  return attendanceActions.verifyAttendanceViaQR(token);
}

export async function recordManualAttendance(sessionId: string, targetUserId: string, status: any, excuseNote?: string) {
  return attendanceActions.recordManualAttendance(sessionId, targetUserId, status, excuseNote);
}

export async function nudgeUnansweredParticipants(sessionId: string) {
  return attendanceActions.nudgeUnansweredParticipants(sessionId);
}

// 7. Bildirim Eylemleri (Faz 1.6A)
export async function getUserNotifications(limitCount?: number) {
  return notificationActions.getUserNotifications(limitCount);
}

export async function markNotificationAsRead(notificationId: string) {
  return notificationActions.markNotificationAsRead(notificationId);
}

export async function markAllNotificationsAsRead() {
  return notificationActions.markAllNotificationsAsRead();
}

export async function sendAppNotification(payload: any) {
  return notificationActions.sendAppNotification(payload);
}

