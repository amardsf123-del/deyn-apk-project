package com.deyn.ouisyncpoc

import android.Manifest
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.equalitie.ouisync.service.Service
import org.equalitie.ouisync.service.initLog
import org.equalitie.ouisync.session.AccessMode
import org.equalitie.ouisync.session.Repository
import org.equalitie.ouisync.session.Session
import org.equalitie.ouisync.session.close
import org.equalitie.ouisync.session.create
import java.util.UUID

/** Isolated test harness only; not part of the DEYN production app. */
class MainActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var service: Service? = null
    private var session: Session? = null
    private var repository: Repository? = null
    private lateinit var status: TextView
    private lateinit var tokenInput: EditText
    private lateinit var tokenOutput: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        requestNearbyPermissionIfNeeded()
        initializeOuisync()
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 28, 28, 28)
        }
        status = TextView(this).apply { text = "تهيئة Ouisync..." }
        tokenInput = EditText(this).apply { hint = "ألصق رمز الربط من الهاتف الأول"; minLines = 2 }
        tokenOutput = EditText(this).apply {
            hint = "رمز مشاركة هذا الهاتف"
            minLines = 3
            isFocusable = false
            isClickable = true
        }
        val create = Button(this).apply { text = "إنشاء محل تجريبي" }
        val join = Button(this).apply { text = "الانضمام إلى المحل" }
        val send = Button(this).apply { text = "إرسال عملية اختبار" }
        val refresh = Button(this).apply { text = "تحديث حالة المزامنة" }
        listOf(status, create, tokenOutput, join, tokenInput, send, refresh).forEach {
            root.addView(it, LinearParams())
        }
        setContentView(ScrollView(this).apply { addView(root) })
        create.setOnClickListener { runAction("إنشاء محل") { createShopRepo() } }
        join.setOnClickListener { runAction("الانضمام") { joinShopRepo(tokenInput.text.toString().trim()) } }
        send.setOnClickListener { runAction("إرسال عملية") { sendTestEvent() } }
        refresh.setOnClickListener { runAction("تحديث") { refreshStatus() } }
        tokenOutput.setOnLongClickListener {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("DEYN POC share token", tokenOutput.text))
            status.text = "تم نسخ رمز المشاركة"
            true
        }
    }

    private fun LinearParams() = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
    )

    private fun requestNearbyPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.NEARBY_WIFI_DEVICES), 41)
        } else if (Build.VERSION.SDK_INT < 33 && Build.VERSION.SDK_INT >= 29 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 41)
        }
    }

    private fun initializeOuisync() = runAction("بدء خدمة Ouisync") {
        withContext(Dispatchers.IO) {
            val config = getDir("ouisync-config", MODE_PRIVATE).absolutePath
            val store = getDir("ouisync-store", MODE_PRIVATE).absolutePath
            initLog()
            service = Service.start(config)
            session = Session.create(config)
            session!!.setStoreDirs(listOf(store))
            session!!.bindNetwork(listOf("quic/0.0.0.0:0", "quic/[::]:0"))
            session!!.setPortForwardingEnabled(false)
            session!!.setLocalDiscoveryEnabled(true)
            repository = session!!.listRepositories().values.firstOrNull()
        }
        status.text = if (repository == null) {
            "جاهز. أنشئ مستودعاً على الهاتف الأول أو انضم برمز الهاتف الأول."
        } else {
            "تم فتح مستودع موجود على هذا الهاتف."
        }
        refreshStatus()
    }

    private suspend fun createShopRepo() {
        val activeSession = session ?: error("الخدمة لم تجهز بعد")
        if (repository != null) error("يوجد مستودع مفتوح بالفعل")
        val repo = activeSession.createRepository(REPO_NAME)
        repo.setSyncEnabled(true)
        repo.setDhtEnabled(false)
        repo.setPexEnabled(false)
        repository = repo
        tokenOutput.setText(repo.share(AccessMode.WRITE).value)
        status.text = "تم إنشاء المستودع. انقل الرمز إلى الهاتف الثاني."
        refreshStatus()
    }

    private suspend fun joinShopRepo(rawToken: String) {
        require(rawToken.isNotBlank()) { "أدخل رمز المشاركة أولاً" }
        val activeSession = session ?: error("الخدمة لم تجهز بعد")
        if (repository != null) error("يوجد مستودع مفتوح بالفعل")
        val token = activeSession.validateShareToken(rawToken)
        val repo = activeSession.createRepository(REPO_NAME, token = token)
        repo.setSyncEnabled(true)
        repo.setDhtEnabled(false)
        repo.setPexEnabled(false)
        repository = repo
        status.text = "انضم الهاتف إلى المستودع. انتظر اكتشاف الهاتف الآخر."
        refreshStatus()
    }

    private suspend fun sendTestEvent() {
        val repo = repository ?: error("أنشئ مستودعاً أو انضم إليه أولاً")
        if (repo.getEntryType("events") == null) repo.createDirectory("events")
        val id = UUID.randomUUID().toString()
        val payload = "{\"id\":\"" + id + "\",\"kind\":\"poc_ping\",\"device\":\"" +
            Build.MODEL + "\",\"createdAtMs\":" + System.currentTimeMillis() + "}"
        val file = repo.createFile("events/" + id + ".json")
        file.write(0, payload.toByteArray(Charsets.UTF_8))
        file.flush()
        file.close()
        status.text = "أُرسلت عملية اختبار مستقلة: " + id
        refreshStatus()
    }

    private suspend fun refreshStatus() {
        val repo = repository ?: run {
            status.text = "لا يوجد مستودع بعد."
            return
        }
        val events = if (repo.getEntryType("events") == null) emptyList() else repo.readDirectory("events")
        status.text = "المستودع جاهز. عدد ملفات الاختبار المرئية: " + events.size + ".\n" +
            "أرسل عملية من الهاتف الآخر ثم اضغط تحديث."
    }

    private fun runAction(label: String, action: suspend () -> Unit) {
        scope.launch {
            status.text = label + "..."
            try { action() } catch (e: Exception) { status.text = label + " فشل: " + e.message }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.launch(Dispatchers.IO) {
            try { session?.close() } catch (_: Exception) {}
            try { service?.stop() } catch (_: Exception) {}
        }
        scope.cancel()
    }

    companion object { private const val REPO_NAME = "deyn-two-phone-poc" }
}
