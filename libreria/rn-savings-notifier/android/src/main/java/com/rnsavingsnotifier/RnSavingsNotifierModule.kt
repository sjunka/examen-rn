package com.rnsavingsnotifier

import android.Manifest
import android.app.AlertDialog
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import java.util.concurrent.atomic.AtomicInteger

/// Implementación real de `rn-savings-notifier` en Kotlin: `AlertDialog` para
/// el diálogo de confirmación, `NotificationManager` para la notificación
/// local. Mismo contrato que la implementación Swift (ver
/// `RnSavingsNotifierImpl.swift` y el README del paquete).
class RnSavingsNotifierModule(reactContext: ReactApplicationContext) :
  NativeRnSavingsNotifierSpec(reactContext) {

  /// Evita presentar un segundo diálogo mientras el primero sigue en
  /// pantalla: mismo motivo que en iOS, la promesa del primero nunca
  /// resolvería si se pisa con otro diálogo.
  private var isPresentingDialog = false

  /// Un `requestCode` por pedido de permiso para que el callback ignore
  /// resultados de un pedido anterior si llegaran fuera de orden.
  private val nextPermissionRequestCode = AtomicInteger(0)

  /// Un id por notificación para que dos metas cumplidas en la misma
  /// sesión no se pisen entre sí en la bandeja.
  private val nextNotificationId = AtomicInteger(0)

  override fun showConfirmDialog(title: String, message: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject(
        "NO_ACTIVITY",
        "No hay una Activity visible desde la que presentar el diálogo."
      )
      return
    }
    if (isPresentingDialog) {
      promise.reject(
        "DIALOG_ALREADY_PRESENTED",
        "Ya hay un diálogo de rn-savings-notifier presentado; esperá a que se resuelva antes de abrir otro."
      )
      return
    }

    isPresentingDialog = true
    activity.runOnUiThread {
      AlertDialog.Builder(activity)
        .setTitle(title)
        .setMessage(message)
        .setCancelable(false)
        .setNegativeButton("Cancelar") { dialog, _ ->
          dialog.dismiss()
          isPresentingDialog = false
          promise.resolve(false)
        }
        .setPositiveButton("Aceptar") { dialog, _ ->
          dialog.dismiss()
          isPresentingDialog = false
          promise.resolve(true)
        }
        .show()
    }
  }

  override fun notifyGoalCompleted(goalName: String, promise: Promise) {
    val context = reactApplicationContext
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
        PackageManager.PERMISSION_GRANTED
    ) {
      requestNotificationPermissionThenNotify(goalName, promise)
      return
    }
    showNotification(goalName, promise)
  }

  /// Android 13+ requiere el permiso en tiempo de ejecución
  /// `POST_NOTIFICATIONS`. Mismo comportamiento documentado que iOS: si el
  /// usuario lo deniega, la promesa resuelve igual (ver README).
  private fun requestNotificationPermissionThenNotify(goalName: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
    if (activity == null) {
      // Sin Activity que pueda pedir el permiso: mismo comportamiento que un
      // permiso denegado, la meta se cumplió igual, solo no se avisa.
      promise.resolve(null)
      return
    }

    val requestCode = nextPermissionRequestCode.getAndIncrement()
    activity.requestPermissions(
      arrayOf(Manifest.permission.POST_NOTIFICATIONS),
      requestCode,
      PermissionListener { code, _, grantResults ->
        if (code != requestCode) return@PermissionListener false
        if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
          showNotification(goalName, promise)
        } else {
          promise.resolve(null)
        }
        true
      }
    )
  }

  private fun showNotification(goalName: String, promise: Promise) {
    val context = reactApplicationContext
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (!manager.areNotificationsEnabled()) {
      // Notificaciones desactivadas para la app (a nivel de sistema, no de
      // canal): mismo comportamiento documentado que un permiso denegado.
      promise.resolve(null)
      return
    }

    val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Metas de ahorro", NotificationManager.IMPORTANCE_DEFAULT)
      )
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }
      .setContentTitle("¡Meta cumplida!")
      .setContentText("Completaste tu meta de ahorro \"$goalName\".")
      .setSmallIcon(context.applicationInfo.icon)
      .setAutoCancel(true)
      .build()

    try {
      manager.notify(nextNotificationId.getAndIncrement(), notification)
      promise.resolve(null)
    } catch (error: SecurityException) {
      promise.reject("NOTIFICATION_SCHEDULE_FAILED", error.message, error)
    }
  }

  companion object {
    const val NAME = NativeRnSavingsNotifierSpec.NAME
    private const val CHANNEL_ID = "rn-savings-notifier-goal-completed"
  }
}
