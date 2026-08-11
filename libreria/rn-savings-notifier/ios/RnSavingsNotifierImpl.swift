import Foundation
import React
import UIKit
import UserNotifications

/// Implementación real de `rn-savings-notifier` en Swift. El puente
/// JS-nativo se genera con codegen como TurboModule (ver `RnSavingsNotifier.mm`),
/// pero toda la lógica vive aquí. Ver el ADR del paquete para la
/// justificación de TurboModule frente a NativeModule.
@objc(RnSavingsNotifierImpl)
public class RnSavingsNotifierImpl: NSObject {

  /// Instancia única: `UNUserNotificationCenter` solo admite un delegate a
  /// la vez, y necesitamos que sea siempre el mismo objeto vivo mientras la
  /// app corre para poder mostrar notificaciones con la app en primer plano.
  @objc public static let shared = RnSavingsNotifierImpl()

  /// Delegate de notificaciones que la app anfitriona ya tenía registrado
  /// antes de que esta librería tomara el suyo, si había alguno. Se le
  /// reenvía `willPresent` para no pisar su lógica de presentación en
  /// primer plano (push notifications propias de la app, por ejemplo).
  private weak var previousNotificationDelegate: UNUserNotificationCenterDelegate?

  /// Evita que una segunda llamada a `showConfirmDialog` mientras la
  /// primera sigue presentada intente presentar sobre un presenter que ya
  /// está presentando: UIKit la ignora en silencio y esa promesa nunca
  /// resolvería.
  private var isPresentingDialog = false

  private override init() {
    super.init()
    previousNotificationDelegate = UNUserNotificationCenter.current().delegate
    UNUserNotificationCenter.current().delegate = self
  }

  @objc(showConfirmDialogWithTitle:message:resolve:reject:)
  public func showConfirmDialog(
    title: String,
    message: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard !self.isPresentingDialog else {
        reject(
          "DIALOG_ALREADY_PRESENTED",
          "Ya hay un diálogo de rn-savings-notifier presentado; esperá a que se resuelva antes de abrir otro.",
          nil
        )
        return
      }

      guard let presenter = Self.topViewController() else {
        reject(
          "NO_VIEW_CONTROLLER",
          "No hay un UIViewController visible desde el que presentar el diálogo.",
          nil
        )
        return
      }

      self.isPresentingDialog = true
      let finish: (Bool) -> Void = { accepted in
        self.isPresentingDialog = false
        resolve(accepted)
      }

      let alert = UIAlertController(
        title: title,
        message: message,
        preferredStyle: .alert
      )
      alert.addAction(
        UIAlertAction(title: "Cancelar", style: .cancel) { _ in
          finish(false)
        }
      )
      alert.addAction(
        UIAlertAction(title: "Aceptar", style: .default) { _ in
          finish(true)
        }
      )
      presenter.present(alert, animated: true)
    }
  }

  @objc(notifyGoalCompletedWithGoalName:resolve:reject:)
  public func notifyGoalCompleted(
    goalName: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    center.getNotificationSettings { settings in
      switch settings.authorizationStatus {
      case .authorized, .provisional, .ephemeral:
        Self.scheduleNotification(
          goalName: goalName,
          resolve: resolve,
          reject: reject
        )
      case .notDetermined:
        center.requestAuthorization(options: [.alert, .sound, .badge]) {
          granted,
          _ in
          if granted {
            Self.scheduleNotification(
              goalName: goalName,
              resolve: resolve,
              reject: reject
            )
          } else {
            // Denegado en la primera solicitud: comportamiento documentado en
            // el README — resolvemos en silencio, sin notificación y sin
            // rechazar la promesa. La meta sigue cumplida igual, solo no se
            // avisa por este canal.
            resolve(nil)
          }
        }
      case .denied:
        // Denegado en un intento previo: mismo comportamiento documentado.
        resolve(nil)
      @unknown default:
        resolve(nil)
      }
    }
  }

  private static func scheduleNotification(
    goalName: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let content = UNMutableNotificationContent()
    content.title = "¡Meta cumplida!"
    content.body = "Completaste tu meta de ahorro \"\(goalName)\"."
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: UUID().uuidString,
      content: content,
      trigger: nil
    )
    UNUserNotificationCenter.current().add(request) { error in
      if let error {
        reject("NOTIFICATION_SCHEDULE_FAILED", error.localizedDescription, error)
      } else {
        resolve(nil)
      }
    }
  }

  private static func topViewController(
    base: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.keyWindow }
      .first?.rootViewController
  ) -> UIViewController? {
    if let nav = base as? UINavigationController {
      return topViewController(base: nav.visibleViewController)
    }
    if let tab = base as? UITabBarController {
      return topViewController(base: tab.selectedViewController)
    }
    if let presented = base?.presentedViewController {
      return topViewController(base: presented)
    }
    return base
  }
}

extension RnSavingsNotifierImpl: UNUserNotificationCenterDelegate {
  // Vive en la librería, no en la app: es el requisito del ticket para que
  // la notificación se muestre también con la app en primer plano, sin que
  // la app consumidora tenga que registrar su propio delegate. Si la app ya
  // tenía un delegate propio (por ejemplo, para sus push notifications), se
  // le reenvía la decisión en lugar de pisarla.
  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler:
      @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if let previousNotificationDelegate,
      previousNotificationDelegate.responds(
        to: #selector(
          UNUserNotificationCenterDelegate
            .userNotificationCenter(_:willPresent:withCompletionHandler:)
        )
      )
    {
      previousNotificationDelegate.userNotificationCenter?(
        center,
        willPresent: notification,
        withCompletionHandler: completionHandler
      )
      return
    }

    completionHandler([.banner, .list, .sound])
  }
}
