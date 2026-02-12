import 'package:flutter/material.dart';
import 'package:testflutter/screens/login_screen.dart';
import 'package:testflutter/widgets/custom_scaffold.dart';
import 'package:testflutter/theme/theme.dart';
import 'package:provider/provider.dart';
import 'package:testflutter/providers/auth_provider.dart';
import 'package:testflutter/models/user.dart';
 class signupsecreen extends StatefulWidget{

   const signupsecreen({super.key});
   @override
  State<signupsecreen>  createState()=> _signupScreenState();
  }
  class _signupScreenState extends State<signupsecreen>{
    final _formSignupKey = GlobalKey<FormState>();
    final _fullNameController = TextEditingController();
    final _emailController = TextEditingController();
    final _passwordController = TextEditingController();
    UserRole _selectedRole = UserRole.operator;
    bool agreePersonalData = true;

    @override
    void dispose() {
      _fullNameController.dispose();
      _emailController.dispose();
      _passwordController.dispose();
      super.dispose();
    }

    Future<void> _handleSignup() async {
      if (_formSignupKey.currentState!.validate() && agreePersonalData) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        
        final success = await authProvider.signup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          fullName: _fullNameController.text.trim(),
          role: _selectedRole,
        );

        if (!mounted) return;

        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account created successfully! Please sign in.'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (e) => const loginscreen()),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(authProvider.errorMessage ?? 'Signup failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } else if (!agreePersonalData) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please agree to the processing of personal data'),
          ),
        );
      }
    }

  @override
  Widget build(BuildContext context) {
    return customscaffold(
    child: Column(
    children: [
    const Expanded(
    flex: 1,
    child: SizedBox(
    height: 10,
    ),
    ),
    Expanded(
    flex: 7,
    child: Container(
    padding: const EdgeInsets.fromLTRB(25.0, 50.0, 25.0, 20.0),
    decoration: const BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.only(
    topLeft: Radius.circular(40.0),
    topRight: Radius.circular(40.0),
    ),
    ),
    child: SingleChildScrollView(
    // get started form
    child: Form(
    key: _formSignupKey,
    child: Column(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
    // get started text
    Text(
    'Get Started',
    style: TextStyle(
    fontSize: 30.0,
    fontWeight: FontWeight.w900,
    color: lightColorScheme.primary,
    ),
    ),
    const SizedBox(
    height: 40.0,
    ),
    // full name
    TextFormField(
    controller: _fullNameController,
    validator: (value) {
    if (value == null || value.isEmpty) {
    return 'Please enter Full name';
    }
    return null;
    },
    decoration: InputDecoration(
    label: const Text('Full Name'),
    hintText: 'Enter Full Name',
    hintStyle: const TextStyle(
    color: Colors.black26,
    ),
    border: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    ),
    ),
    const SizedBox(
    height: 25.0,
    ),
    // email
    TextFormField(
    controller: _emailController,
    validator: (value) {
    if (value == null || value.isEmpty) {
    return 'Please enter Email';
    }
    return null;
    },
    decoration: InputDecoration(
    label: const Text('Email'),
    hintText: 'Enter Email',
    hintStyle: const TextStyle(
    color: Colors.black26,
    ),
    border: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    ),
    ),
    const SizedBox(
    height: 25.0,
    ),
    // password
    TextFormField(
    controller: _passwordController,
    obscureText: true,
    obscuringCharacter: '*',
    validator: (value) {
    if (value == null || value.isEmpty) {
    return 'Please enter Password';
    }
    return null;
    },
    decoration: InputDecoration(
    label: const Text('Password'),
    hintText: 'Enter Password',
    hintStyle: const TextStyle(
    color: Colors.black26,
    ),
    border: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    ),
    ),
    const SizedBox(
    height: 25.0,
    ),
    // Role Selection
    DropdownButtonFormField<UserRole>(
      value: _selectedRole,
      decoration: InputDecoration(
        label: const Text('Role'),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      items: UserRole.values.map((UserRole role) {
        return DropdownMenuItem<UserRole>(
          value: role,
          child: Text(role.name),
        );
      }).toList(),
      onChanged: (UserRole? newValue) {
        setState(() {
          _selectedRole = newValue!;
        });
      },
    ),
    const SizedBox(
    height: 25.0,
    ),
    // i agree to the processing
    Row(
    children: [
    Checkbox(
    value: agreePersonalData,
    onChanged: (bool? value) {
    setState(() {
    agreePersonalData = value!;
    });
    },
    activeColor: lightColorScheme.primary,
    ),
    const Text(
    'I agree to the processing of ',
    style: TextStyle(
    color: Colors.black45,
    ),
    ),
    Text(
    'Personal data',
    style: TextStyle(
    fontWeight: FontWeight.bold,
    color: lightColorScheme.primary,
    ),
    ),
    ],
    ),
    const SizedBox(
    height: 25.0,
    ),
    // signup button
    Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: authProvider.isLoading ? null : _handleSignup,
            child: authProvider.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Sign up'),
          ),
        );
      },
    ),
    const SizedBox(
    height: 30.0,
    ),
    // sign up divider
    Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
    Expanded(
    child: Divider(
    thickness: 0.7,
    color: Colors.grey.withOpacity(0.5),
    ),
    ),
    const Padding(
    padding: EdgeInsets.symmetric(
    vertical: 0,
    horizontal: 10,
    ),
    child: Text(
    'Sign up with',
    style: TextStyle(
    color: Colors.black45,
    ),
    ),
    ),
    Expanded(
    child: Divider(
    thickness: 0.7,
    color: Colors.grey.withOpacity(0.5),
    ),
    ),
    ],
    ),
    const SizedBox(
    height: 30.0,
    ),
    // sign up social media logo
    const SizedBox(
    height: 25.0,
    ),
    // already have an account
    Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
    const Text(
    'Already have an account? ',
    style: TextStyle(
    color: Colors.black45,
    ),
    ),
    GestureDetector(
    onTap: () {
    Navigator.push(
    context,
    MaterialPageRoute(
    builder: (e) => const loginscreen(),
    ),
    );
    },
    child: Text(
    'Sign in',
    style: TextStyle(
    fontWeight: FontWeight.bold,
    color: lightColorScheme.primary,
    ),
    ),
    ),
    ],
    ),
    const SizedBox(
    height: 20.0,
    ),
    ],
    ),
    ),
    ),
    ),
    ),
    ],
    ),
    );
  }
  }

