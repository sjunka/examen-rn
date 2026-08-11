package com.rnsavingsnotifier

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

// Pendiente de implementación (ver README: "Pendientes"). iOS es la
// plataforma de demo del examen; este stub mantiene el spec de codegen
// consistente en ambas plataformas sin romper el build de Android.
class RnSavingsNotifierModule(reactContext: ReactApplicationContext) :
  NativeRnSavingsNotifierSpec(reactContext) {

  override fun showConfirmDialog(title: String, message: String, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "rn-savings-notifier: Android pendiente de implementación.")
  }

  override fun notifyGoalCompleted(goalName: String, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "rn-savings-notifier: Android pendiente de implementación.")
  }

  companion object {
    const val NAME = NativeRnSavingsNotifierSpec.NAME
  }
}
